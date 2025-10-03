# ADR-003: Database Integration with Vercel Postgres

## Status
Accepted

## Context
work-managementプロジェクトにおいて、データ永続化とデータアクセス層の実装方針を決定する必要がある。パフォーマンス、スケーラビリティ、開発効率性、運用コスト、セキュリティを考慮したデータベース選択とORM選択が求められる。

## Decision

### Database Platform
- **Vercel Postgres** (PostgreSQL 15+)
- **Connection Pooling** with @vercel/postgres
- **Edge-compatible** database access

### ORM & Query Builder
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for schema migrations
- **TypeScript-first** schema definition

### Data Access Architecture
- **Repository Pattern** for data layer abstraction
- **Connection Pool Management**
- **Query Optimization** with proper indexing
- **Transaction Management**

### Development Tools
- **Database Seeding** for development/testing
- **Schema Validation** with runtime checks
- **Migration Automation** in CI/CD

## Directory Structure
```
work-management/
├── drizzle/                   # Database schema and migrations
│   ├── migrations/           # Generated migration files
│   ├── schema.ts            # Database schema definition
│   └── seed.ts              # Database seeding
├── lib/
│   ├── db/                  # Database utilities
│   │   ├── connection.ts    # Database connection
│   │   ├── queries.ts       # Complex queries
│   │   └── repositories/    # Repository pattern
│   │       ├── users.ts
│   │       ├── tasks.ts
│   │       └── base.ts      # Base repository
│   └── db.ts               # Main database export
├── drizzle.config.ts       # Drizzle configuration
└── .env.local              # Environment variables
```

## Database Schema Design

### Core Entities
```typescript
// drizzle/schema.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'user']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('todo').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project Members (Many-to-Many)
export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Task Comments
export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit Log
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  changes: text('changes'), // JSON string of changes
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Database Configuration
```typescript
// lib/db/connection.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from '@/drizzle/schema';

export const db = drizzle(sql, { schema });

// Health check function
export async function healthCheck() {
  try {
    await sql`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// Connection pool monitoring
export async function getConnectionStats() {
  const result = await sql`
    SELECT 
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      count(*) FILTER (WHERE state = 'idle') as idle_connections
    FROM pg_stat_activity 
    WHERE datname = current_database()
  `;
  return result.rows[0];
}
```

### Repository Pattern Implementation
```typescript
// lib/db/repositories/base.ts
import { db } from '@/lib/db/connection';
import { SQL, eq } from 'drizzle-orm';

export abstract class BaseRepository<T extends Record<string, any>> {
  constructor(protected table: T) {}

  async findById(id: string) {
    const result = await db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    return result[0] || null;
  }

  async findMany(where?: SQL, limit = 50, offset = 0) {
    let query = db.select().from(this.table);
    
    if (where) {
      query = query.where(where);
    }
    
    return await query.limit(limit).offset(offset);
  }

  async create(data: Partial<T>) {
    const result = await db.insert(this.table).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<T>) {
    const result = await db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await db.delete(this.table).where(eq(this.table.id, id));
  }
}

// lib/db/repositories/users.ts
import { users, type User } from '@/drizzle/schema';
import { BaseRepository } from './base';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    role?: 'admin' | 'manager' | 'user';
  }) {
    const result = await db.insert(users).values({
      ...userData,
      role: userData.role || 'user',
    }).returning();
    return result[0];
  }

  async updateLastLogin(id: string) {
    await db.update(users).set({
      updatedAt: new Date(),
    }).where(eq(users.id, id));
  }

  async getUserStats() {
    const result = await db.execute(sql`
      SELECT 
        role,
        count(*) as count,
        count(*) FILTER (WHERE email_verified = true) as verified_count
      FROM users 
      GROUP BY role
    `);
    return result.rows;
  }
}

export const userRepository = new UserRepository();
```

### Migration Management
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;

// package.json scripts
{
  "db:generate": "drizzle-kit generate:pg",
  "db:migrate": "drizzle-kit push:pg",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx drizzle/seed.ts"
}
```

### Database Seeding
```typescript
// drizzle/seed.ts
import { db } from '@/lib/db/connection';
import { users, projects, tasks } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const [admin] = await db.insert(users).values({
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    passwordHash: adminPasswordHash,
    emailVerified: true,
  }).returning();

  // Create test users
  const userPasswordHash = await bcrypt.hash('user123', 12);
  const [testUser] = await db.insert(users).values({
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
    passwordHash: userPasswordHash,
    emailVerified: true,
  }).returning();

  // Create sample project
  const [project] = await db.insert(projects).values({
    name: 'Sample Project',
    description: 'A sample project for testing',
    ownerId: admin.id,
  }).returning();

  // Create sample tasks
  await db.insert(tasks).values([
    {
      title: 'Setup project structure',
      description: 'Initialize the project with proper folder structure',
      status: 'completed',
      priority: 'high',
      assigneeId: admin.id,
      createdById: admin.id,
      completedAt: new Date(),
    },
    {
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      status: 'in_progress',
      priority: 'high',
      assigneeId: testUser.id,
      createdById: admin.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: 'Design database schema',
      description: 'Create comprehensive database schema for the application',
      status: 'todo',
      priority: 'medium',
      createdById: admin.id,
    },
  ]);

  console.log('✅ Database seeded successfully!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
```

## Rationale

### Vercel Postgres
- **Seamless Integration**: Vercel ecosystem native integration
- **Edge Compatibility**: Global database access with low latency
- **Auto Scaling**: Automatic connection pooling and scaling
- **Zero Configuration**: Minimal setup and configuration required
- **Cost Efficiency**: Pay-per-use pricing model
- **PostgreSQL Standard**: Full PostgreSQL feature set

### Drizzle ORM
- **TypeScript Native**: Full type safety from schema to queries
- **Performance**: Minimal overhead, close to raw SQL performance
- **Developer Experience**: Excellent IntelliSense and error messages
- **Flexibility**: Raw SQL support when needed
- **Migration Safety**: Automatic schema migration generation
- **Bundle Size**: Smaller bundle compared to alternatives

### Repository Pattern
- **Separation of Concerns**: Clear data access layer abstraction
- **Testability**: Easy mocking and testing of data operations
- **Consistency**: Standardized data access patterns
- **Maintainability**: Centralized business logic for data operations

## Performance Optimizations

### Connection Management
```typescript
// Connection pooling configuration
export const dbConfig = {
  connectionString: process.env.POSTGRES_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20, // Maximum number of connections in pool
};
```

### Query Optimization
- **Indexing Strategy**: Strategic indexes on frequently queried columns
- **Query Analysis**: Regular EXPLAIN ANALYZE for performance monitoring
- **Connection Reuse**: Proper connection pooling and reuse
- **Prepared Statements**: Automatic query plan caching

### Monitoring & Observability
```typescript
// lib/db/monitoring.ts
export async function getQueryPerformance() {
  const result = await sql`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      min_time,
      max_time
    FROM pg_stat_statements 
    ORDER BY total_time DESC 
    LIMIT 10
  `;
  return result.rows;
}

export async function getDatabaseSize() {
  const result = await sql`
    SELECT 
      pg_size_pretty(pg_database_size(current_database())) as size
  `;
  return result.rows[0];
}
```

## Security Considerations

### Access Control
- **Role-based Access**: Database-level user permissions
- **Row Level Security**: PostgreSQL RLS for multi-tenant data
- **Input Sanitization**: Parameterized queries only
- **Audit Logging**: Comprehensive audit trail

### Data Protection
- **Encryption at Rest**: Vercel Postgres automatic encryption
- **Encryption in Transit**: TLS connection enforcement
- **Sensitive Data**: Hashed passwords, PII handling
- **Backup Security**: Encrypted backup storage

## Backup & Recovery

### Backup Strategy
- **Automatic Backups**: Vercel Postgres automatic daily backups
- **Point-in-time Recovery**: 7-day recovery window
- **Development Dumps**: Regular development data exports
- **Disaster Recovery**: Cross-region backup replication

### Data Migration
```typescript
// Migration rollback strategy
export async function rollbackMigration(version: string) {
  const migrationFile = `./drizzle/migrations/${version}-rollback.sql`;
  const migration = await fs.readFile(migrationFile, 'utf-8');
  await sql.unsafe(migration);
}
```

## Consequences

### Positive
- **Type Safety**: End-to-end type safety from database to API
- **Performance**: Optimized queries and connection pooling
- **Developer Experience**: Excellent tooling and debugging
- **Scalability**: Automatic scaling with demand
- **Reliability**: Enterprise-grade database reliability

### Negative
- **Vendor Lock-in**: Vercel ecosystem dependency
- **Learning Curve**: Drizzle ORM specific patterns
- **Migration Complexity**: Schema changes in production

### Mitigation
- **Database Abstraction**: Repository pattern for vendor independence
- **Documentation**: Comprehensive migration and rollback procedures
- **Testing**: Extensive database operation testing
- **Monitoring**: Proactive performance and error monitoring

## References
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)