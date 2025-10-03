# ADR-004: Development Guidelines and Best Practices

## Status
Accepted

## Context
work-managementプロジェクトにおいて、一貫した開発プロセス、コーディング規約、テスト戦略、デプロイメント戦略を確立する必要がある。チーム開発での品質担保、保守性向上、開発効率性を確保するための包括的なガイドラインが求められる。

## Decision

### Development Workflow
- **Git Flow** with feature branches
- **Conventional Commits** for commit messages
- **Pull Request** mandatory for all changes
- **Code Review** required before merge
- **Automated Testing** in CI/CD pipeline

### Code Quality Standards
- **TypeScript Strict Mode** enabled
- **Biome** for linting and formatting
- **Pre-commit Hooks** for quality checks
- **100% Type Coverage** requirement
- **ESLint Rules** via Biome configuration

### Testing Strategy
- **Unit Tests** with Vitest
- **Integration Tests** for API endpoints
- **End-to-End Tests** with Playwright
- **Database Tests** with test database
- **Test Coverage** minimum 80%

### Performance Requirements
- **Core Web Vitals** optimization
- **Bundle Size** monitoring
- **Database Query** optimization
- **API Response Time** < 200ms
- **Page Load Time** < 2s

## Development Guidelines

### Project Structure Standards
```typescript
// File naming conventions
// Components: PascalCase (e.g., UserProfile.tsx)
// Utilities: camelCase (e.g., formatDate.ts)
// Pages: kebab-case (e.g., user-settings/page.tsx)
// API routes: kebab-case (e.g., api/users/route.ts)
// Constants: SCREAMING_SNAKE_CASE (e.g., API_ENDPOINTS.ts)

// Directory structure rules
components/
├── ui/              # Basic UI components (Button, Input, etc.)
├── forms/           # Form-specific components
├── features/        # Feature-specific components
└── layouts/         # Layout components

lib/
├── utils/           # Pure utility functions
├── hooks/           # Custom React hooks
├── constants/       # Application constants
├── validations/     # Zod schemas
└── services/        # External service integrations
```

### TypeScript Configuration
```typescript
// tsconfig.json - Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}

// Type definition standards
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Use type aliases for unions and primitives
type UserRole = 'admin' | 'manager' | 'user';
type UserId = string;

// Use const assertions for immutable data
const USER_ROLES = ['admin', 'manager', 'user'] as const;
```

### Component Development Standards
```typescript
// Component structure template
import { type FC, type PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const Component: FC<PropsWithChildren<ComponentProps>> = ({
  children,
  className,
  variant = 'primary',
}) => {
  return (
    <div className={cn('base-styles', variant === 'primary' && 'primary-styles', className)}>
      {children}
    </div>
  );
};

// Custom hooks pattern
import { useState, useEffect } from 'react';

interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[]): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncReturn<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    asyncFn()
      .then(data => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}
```

### API Development Standards
```typescript
// API route structure template
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

// Request validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'user']).default('user'),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Request validation
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // Business logic
    const user = await userRepository.create(validatedData);

    // Success response
    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 201 });

  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

### Database Operations Standards
```typescript
// Repository method patterns
export class UserRepository extends BaseRepository<typeof users> {
  // Use transactions for complex operations
  async createUserWithProfile(userData: CreateUserData, profileData: CreateProfileData) {
    return await db.transaction(async (tx) => {
      const user = await tx.insert(users).values(userData).returning();
      const profile = await tx.insert(profiles).values({
        ...profileData,
        userId: user[0].id,
      }).returning();
      
      return { user: user[0], profile: profile[0] };
    });
  }

  // Use proper error handling
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Database error in findByEmail:', error);
      throw new Error('Failed to find user by email');
    }
  }

  // Use proper indexing for performance
  async searchUsers(query: string, limit = 20, offset = 0) {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(users.name);
  }
}
```

## Testing Standards

### Unit Testing Guidelines
```typescript
// Test file naming: *.test.ts or *.spec.ts
// Test structure with Vitest
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<UserProfile user={null} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// API route testing
import { GET } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

describe('/api/users', () => {
  it('should return users list', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Integration Testing
```typescript
// Database integration tests
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/db/connection';
import { users } from '@/drizzle/schema';
import { userRepository } from '@/lib/db/repositories/users';

describe('UserRepository Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  afterAll(async () => {
    // Cleanup test database
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  beforeEach(async () => {
    // Reset data for each test
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  it('should create and retrieve user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
    };

    const createdUser = await userRepository.createUser(userData);
    const foundUser = await userRepository.findByEmail(userData.email);

    expect(foundUser).toEqual(createdUser);
  });
});
```

### End-to-End Testing
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });
});
```

## Performance Standards

### Bundle Optimization
```typescript
// next.config.ts - Performance optimizations
const nextConfig = {
  // Enable experimental features for performance
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'lucide-react'],
  },
  
  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60' },
        ],
      },
    ];
  },
};
```

### Database Performance
```typescript
// Performance monitoring utilities
export async function logSlowQueries() {
  await sql`
    SELECT 
      query,
      calls,
      total_time,
      mean_time
    FROM pg_stat_statements 
    WHERE mean_time > 100  -- Queries taking more than 100ms
    ORDER BY mean_time DESC
  `;
}

// Query optimization patterns
// ❌ Bad: N+1 query problem
const users = await userRepository.findMany();
const usersWithTasks = await Promise.all(
  users.map(user => taskRepository.findByUserId(user.id))
);

// ✅ Good: Single query with join
const usersWithTasks = await db
  .select()
  .from(users)
  .leftJoin(tasks, eq(users.id, tasks.assigneeId))
  .where(eq(users.active, true));
```

## Security Standards

### Input Validation
```typescript
// Always validate input with Zod
const UserUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'user']),
}).partial();

// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input);
}
```

### Authentication Security
```typescript
// Password hashing
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  return { success, limit, reset, remaining };
}
```

## Deployment Standards

### Environment Configuration
```typescript
// Environment variables validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  POSTGRES_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Code Review Guidelines

### Review Checklist
- [ ] Code follows TypeScript strict mode standards
- [ ] All functions have proper type annotations
- [ ] Error handling is implemented correctly
- [ ] Database queries are optimized
- [ ] Security best practices are followed
- [ ] Tests cover new functionality
- [ ] Performance impact is considered
- [ ] Documentation is updated if needed

### Review Standards
```typescript
// ❌ Bad: Missing error handling
async function getUser(id: string) {
  const user = await userRepository.findById(id);
  return user;
}

// ✅ Good: Proper error handling and types
async function getUser(id: string): Promise<User | null> {
  try {
    const user = await userRepository.findById(id);
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    throw new Error('Failed to retrieve user');
  }
}
```

## Consequences

### Positive
- **Code Quality**: Consistent, maintainable codebase
- **Developer Experience**: Clear guidelines and automated tooling
- **Performance**: Optimized application performance
- **Security**: Comprehensive security measures
- **Reliability**: Thorough testing and monitoring

### Negative
- **Learning Curve**: Additional setup and learning required
- **Development Overhead**: More process and checks
- **Tool Dependencies**: Reliance on specific tools and services

### Mitigation
- **Documentation**: Comprehensive development documentation
- **Training**: Team training on standards and tools
- **Automation**: Automated enforcement of standards
- **Continuous Improvement**: Regular review and updates

## References
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Next.js Performance Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/)