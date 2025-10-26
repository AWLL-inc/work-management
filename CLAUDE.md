# Work Management - Claude Project Context

## Project Overview
A modern work management application built with Next.js 15, featuring task management, user collaboration, and project organization capabilities. Deployed on Vercel with Postgres database integration.

## Documentation

### Document Organization
- **Central Hub**: `docs/adr/` - Architecture Decision Records
- **Index**: `docs/adr/README.md` - ADR map and navigation  
- **Technical Specs**: Individual ADR files for technical decisions

### Document Structure
```
docs/
├── adr/                   # Architecture Decision Records
│   ├── README.md         # ADR index and overview
│   ├── 001-nextjs-vercel-architecture.md
│   ├── 002-server-side-implementation.md
│   ├── 003-database-integration.md
│   ├── 004-development-guidelines.md
│   ├── 005-ui-library-and-data-table.md
│   └── 006-ag-grid-standard-compliance.md
```

### Language Guidelines
- **English**: Code, comments, commit messages, API documentation
- **Japanese**: ADR documentation (as per project requirements)
- **Consistency**: Maintain language consistency within document types

## Architecture Decision Records (ADR)

Architecture decisions are documented in `docs/adr/` using a structured format. When creating new ADRs:
- Follow the existing format used in ADR-001 through ADR-005
- Use sequential numbering: `001-`, `002-`, etc.
- Write in Japanese as per documentation guidelines
- Update the index in `docs/adr/README.md`

### Existing ADRs
- **ADR-001**: Next.js with Vercel Architecture - Frontend framework and hosting decisions
- **ADR-002**: Server-side Implementation Architecture - API design and authentication
- **ADR-003**: Database Integration with Vercel Postgres - Data layer and ORM choices
- **ADR-004**: Development Guidelines and Best Practices - Coding standards and workflow
- **ADR-005**: UIライブラリとデータテーブルの選定 - UI components and data table library selection
- **ADR-006**: AG Grid標準準拠の実装ガイドライン - AG Grid implementation standards and customization guidelines

### Creating New ADRs
When making significant technical decisions, document them as ADRs:
1. Identify the decision that needs documentation
2. Create a new ADR file with the next sequential number
3. Include: Status, Context, Decision, Rationale, Consequences
4. Update the README.md index
5. Reference the ADR in relevant code or documentation

## Coding Standards

### Development Standards Overview
- **TypeScript**: Strict mode with 100% type coverage requirement
- **Code Quality**: Biome for linting and formatting (replaces ESLint + Prettier)
- **Testing**: Comprehensive test coverage with Vitest and Playwright
- **Git Workflow**: Conventional commits with feature branches
- **Performance**: Core Web Vitals optimization and bundle monitoring

### AG Grid Implementation Standards (ADR-006)
**CRITICAL**: AG Grid implementations must follow standard patterns to ensure stability and maintainability.

#### 🚨 Required Standards
- **AG Grid APIs Only**: Use `gridApi.applyTransaction()` for all data modifications
- **Single Source of Truth**: AG Grid internal data is the authoritative source
- **Standard Events**: Use `onCellValueChanged`, `onGridReady` - avoid custom event handling
- **Validation**: Perform validation at save time, not during cell editing

#### ✅ Approved Patterns
```typescript
// Row addition (Standard)
gridApi.applyTransaction({ add: [newRow], addIndex: 0 });

// Data retrieval (Standard)
const currentData = [];
gridApi.forEachNode(node => currentData.push(node.data));

// Batch operations (Standard)
await Promise.all([deletePromises, createPromises, updatePromises]);
```

#### ❌ Prohibited Patterns
```typescript
// DON'T: Duplicate state management
const [gridRowData, setGridRowData] = useState([]);

// DON'T: Toast in valueParser
valueParser: (params) => {
  if (!valid) toast.error("Error"); // Prohibited
}

// DON'T: Complex custom event handling
onCellEditingStopped: (event) => { /* Complex logic */ } // Avoid
```

#### 📋 Deviation Process
1. **Document need**: Why can't standard patterns be used?
2. **Create ADR**: Document the decision and alternatives considered  
3. **Team approval**: Get explicit approval before implementation
4. **Update documentation**: Add to ADR-006 if approved

### Key Standards Documents
- **ADR-004**: Development Guidelines and Best Practices - Comprehensive coding standards
- **TypeScript Configuration**: `tsconfig.json` with strict mode enabled
- **Biome Configuration**: `biome.json` with project-specific rules
- **Component Patterns**: Functional components with TypeScript interfaces

### Code Review Requirements
- TypeScript strict mode compliance
- Biome linting passes without errors
- Unit tests for new functionality
- Integration tests for API changes
- Performance impact consideration
- Security best practices followed

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:generate && npm run db:migrate && npm run db:seed

# Start development server
npm run dev
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5+ (strict mode)
- **UI Components**: shadcn/ui + Radix UI
- **Data Table**: TanStack Table v8
- **Styling**: Tailwind CSS 4 with inline theme configuration
- **Build Tool**: Turbopack

### Backend
- **API**: Next.js API Routes (Edge Runtime)
- **Authentication**: NextAuth.js v5 with JWT strategy
- **Validation**: Zod schemas for all inputs
- **Middleware**: Custom authentication and rate limiting

### Database
- **Database**: Vercel Postgres (PostgreSQL 15+)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Pattern**: Repository pattern for data access

### Development Tools
- **Linting/Formatting**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest (unit), Playwright (E2E)
- **CI/CD**: GitHub Actions with automatic Vercel deployment

## Directory Structure
```
app/                    # Next.js App Router pages and API
├── api/               # API Routes (RESTful endpoints)
├── (auth)/            # Authentication pages (grouped route)
├── dashboard/         # Protected dashboard pages
├── globals.css        # Global styles with Tailwind CSS 4
├── layout.tsx         # Root layout with providers
└── page.tsx           # Landing page

lib/                   # Shared utilities and configurations
├── db/               # Database utilities
│   ├── connection.ts  # Database connection setup
│   └── repositories/ # Repository pattern implementations
├── auth.ts           # NextAuth.js configuration
├── validations.ts    # Zod validation schemas
└── utils.ts          # Utility functions

components/            # Reusable React components
├── ui/               # shadcn/ui components
├── data-table/       # TanStack Table wrappers
└── features/         # Feature-specific components

drizzle/              # Database schema and migrations
├── migrations/       # Auto-generated migration files
├── schema.ts         # Database schema definition
└── seed.ts           # Database seeding scripts

types/                # TypeScript type definitions
docs/adr/             # Architecture Decision Records
tests/                # Test files (unit and integration)
```

## Important Files

### Configuration Files
- `next.config.ts` - Next.js configuration with Turbopack
- `biome.json` - Linting and formatting rules
- `drizzle.config.ts` - Database ORM configuration
- `middleware.ts` - Authentication and security middleware
- `tsconfig.json` - TypeScript strict mode configuration

### Schema and Types
- `drizzle/schema.ts` - Database schema (users, tasks, projects, etc.)
- `lib/validations.ts` - Zod schemas for API validation
- `types/` - TypeScript type definitions

### Authentication
- `lib/auth.ts` - NextAuth.js v5 configuration
- `app/api/auth/[...nextauth]/route.ts` - Authentication endpoints

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Biome linting
npm run format       # Format code with Biome
npm run type-check   # TypeScript type checking
```

### Database
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:seed      # Seed database with sample data
```

### Testing
```bash
npm run test         # Run unit tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests with Playwright
npm run test:coverage # Generate test coverage report
```

### API Testing
```bash
# Test Projects API
curl -X GET 'http://localhost:3000/api/projects?active=true'
curl -X POST 'http://localhost:3000/api/projects' \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Project","description":"Test","isActive":true}'

# Test Work Categories API
curl -X GET 'http://localhost:3000/api/work-categories?active=true'

# Test Work Logs API
curl -X GET 'http://localhost:3000/api/work-logs'
curl -X POST 'http://localhost:3000/api/work-logs' \
  -H 'Content-Type: application/json' \
  -d '{"date":"2024-10-05","hours":"8.0","projectId":"uuid","categoryId":"uuid"}'
```

## Environment Variables

### Required Variables
```bash
# Database
POSTGRES_URL=             # Vercel Postgres connection string
POSTGRES_URL_NON_POOLING= # Non-pooling connection for migrations

# Authentication
NEXTAUTH_SECRET=          # 32+ character secret for JWT signing
NEXTAUTH_URL=             # Application URL (auto-detected in Vercel)

# Optional
NODE_ENV=                 # development, test, production

# Development Settings
DISABLE_AUTH=false        # Set to "true" to disable authentication in development mode
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Set up Vercel Postgres database
3. Configure NextAuth secret: `openssl rand -base64 32`
4. Update NEXTAUTH_URL for production deployment

## API Design

### RESTful Endpoints
```
# Projects Master
GET    /api/projects           # List projects (query: ?active=true)
POST   /api/projects           # Create project (admin only)
GET    /api/projects/[id]      # Get project by ID
PUT    /api/projects/[id]      # Update project (admin only)
DELETE /api/projects/[id]      # Delete project - soft delete (admin only)

# Work Categories Master
GET    /api/work-categories    # List categories (query: ?active=true)
POST   /api/work-categories    # Create category (admin only)
GET    /api/work-categories/[id] # Get category by ID
PUT    /api/work-categories/[id] # Update category (admin only)
DELETE /api/work-categories/[id] # Delete category - soft delete (admin only)

# Work Logs
GET    /api/work-logs          # List work logs (user's own or all for admin)
POST   /api/work-logs          # Create work log
GET    /api/work-logs/[id]     # Get work log by ID
PUT    /api/work-logs/[id]     # Update work log (own or admin)
DELETE /api/work-logs/[id]     # Delete work log (own or admin)
```

### API Documentation
Detailed API specifications are available in the `docs/api/` directory:
- [Projects API](./docs/api/projects.md) - Project master CRUD operations
- [Work Categories API](./docs/api/work-categories.md) - Work category CRUD with ordering
- [Work Logs API](./docs/api/work-logs.md) - Work log management with rich text

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### API Common Design Standards

Based on comprehensive API design principles:

- **Response Format**: All responses follow a consistent structure
  - Success: `{ "success": true, "data": {...} }`
  - List: `{ "success": true, "data": [...], "pagination": {...} }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": {...} } }`
- **Pagination**: Use standard parameters
  - Query params: `page`, `limit` (default: page=1, limit=20)
  - Response: `{ "page": 1, "limit": 20, "total": 100, "totalPages": 5 }`
- **Date Format**: ISO 8601 with timezone (e.g., `2024-10-03T10:00:00+09:00`)
- **Validation**: All inputs validated with Zod schemas
- **Error Codes**: Structured error codes for different failure types
- **HTTP Status Codes**: Follow standard REST conventions
  - 200: Success (GET, PUT, PATCH)
  - 201: Created (POST)
  - 204: No Content (DELETE)
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (authentication required)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found
  - 500: Internal Server Error

## Component Architecture

### Component Placement Rules (Next.js 15 - Pattern 3)

Following Next.js 15 official **"Files split by feature/route"** pattern (2025 best practices):

#### Decision Tree

**1. Route-specific components** → `app/[route]/_components/`
- Used **only within a single route**
- Example: `app/[locale]/admin/teams/_components/team-table.tsx`
- Note: `_components` is a **private folder** (excluded from routing by Next.js)
- Best for: Form components, table columns, dialogs used in one page

**2. Multi-route domain components** → `components/features/[domain]/`
- Shared **across 2+ routes** within the same domain
- Example: `components/features/auth/login-form.tsx` (if used in /login, /register, /reset-password)
- Best for: Reusable domain-specific logic across multiple pages

**3. App-wide components** → `components/ui/` or `components/layouts/`
- **UI primitives**: `components/ui/` (shadcn/ui: buttons, inputs, badges, etc.)
- **Layouts**: `components/layouts/` (page layouts, section wrappers)
- **Data tables**: `components/data-table/` (TanStack Table utilities)
- Best for: Universal components used throughout the application

#### When to Move Components

**Start with `app/[route]/_components/`** and move to `components/features/` only when:
- ✅ Component is **actually reused** in 2+ routes (not just potentially reusable)
- ✅ Follows **YAGNI principle** (You Aren't Gonna Need It)
- ✅ Significant shared logic that benefits from centralization

**Example progression:**
```
1. Initial: app/[locale]/admin/teams/_components/team-form.tsx
   (Used only in /admin/teams)

2. If reused: Move to components/features/admin/teams/team-form.tsx
   (When also used in /admin/teams/[id], /dashboard, etc.)
```

### Frontend Component Strategy (Legacy Reference)
- **UI Primitives**: `components/ui/` - shadcn/ui components (buttons, inputs, labels, etc.)
- **Data Tables**: `components/data-table/` - TanStack Table wrappers and utilities
- **Feature Components**: `components/features/` - Multi-route feature-specific components
- **Layout Components**: `components/layouts/` - Page and section layouts

### Component Development Patterns
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
```

### Component Guidelines
- **TypeScript**: All components use strict TypeScript with proper interfaces
- **Props**: Use PropsWithChildren for components that accept children
- **Styling**: Tailwind CSS with conditional styling using `cn()` utility
- **Accessibility**: Include ARIA labels and proper semantic HTML
- **Testing**: Unit tests for component behavior and rendering

## Database Schema

### Core Tables
- `users` - User accounts with roles (admin, manager, user)
- `tasks` - Task management with status and priority
- `projects` - Project organization
- `project_members` - Many-to-many project membership
- `task_comments` - Task discussion threads
- `audit_logs` - Change tracking and audit trail

### Key Relationships
- Users can be assigned to multiple tasks
- Projects have multiple members with roles
- Tasks belong to projects and have assignees
- Audit logs track all entity changes

## Authentication Flow

### NextAuth.js v5 Configuration
- **Strategy**: JWT with database sessions
- **Providers**: Email/Password (can extend to OAuth)
- **Sessions**: 30-day expiration with automatic renewal
- **Security**: CSRF protection, secure cookies, rate limiting

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/api/*` - Most endpoints require authentication (except `/api/health`)
- Authentication check in `middleware.ts`

### Development Authentication Bypass

For development convenience, you can bypass authentication by setting environment variables:

#### Configuration
```bash
# .env.local
NODE_ENV=development
DISABLE_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000  # Optional, defaults to this value
```

#### Security Features
- **Production Protection**: Automatically disabled in production environment
- **Error Prevention**: Any attempt to enable `DISABLE_AUTH` in production will result in an error
- **Development Only**: Only works when `NODE_ENV=development`
- **Type-Safe**: Uses the same `AuthSession` interface as normal authentication

#### Usage
```bash
# 1. Setup database with seed data
npm run db:seed

# 2. Configure environment variables in .env.local
DISABLE_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000  # Use admin user ID from seed

# 3. Start development server (authentication bypassed)
npm run dev
```

#### Implementation Details
- Uses `getAuthenticatedSession()` helper in `lib/auth-helpers.ts`
- Returns mock admin session when bypass is enabled
- Logs warning message in development console
- Maintains full API compatibility with normal authentication flow

#### Important Notes
⚠️ **Security Warning**: This feature is for development use only

- Never enable in production environments
- DEV_USER_ID should match a valid user from seed data
- All API endpoints maintain the same security model
- Session object structure remains identical to normal authentication

## Testing Guidelines

### Testing Strategy Overview
- **Unit Tests**: Vitest for utilities, components, and business logic
- **Integration Tests**: API endpoints and database operations
- **End-to-End Tests**: Playwright for user workflows
- **Test Coverage**: Minimum 80% coverage requirement

### Unit Testing with Vitest
```typescript
// Test file naming: *.test.ts or *.spec.ts
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
});
```

### API Testing Patterns
```typescript
// API route testing
import { GET, POST } from '@/app/api/users/route';
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

### End-to-End Testing with Playwright
```typescript
// E2E test structure
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
});
```

### Test Coverage Requirements
- **Utilities**: 100% coverage for pure functions
- **Components**: Test rendering and user interactions
- **API Routes**: Test all endpoints and error cases
- **Database**: Test repository methods and transactions
- **E2E**: Test critical user workflows

### Running Tests
```bash
# Unit tests
npm run test           # Run all unit tests
npm run test:watch     # Watch mode for development
npm run test:coverage  # Generate coverage report

# E2E tests
npm run test:e2e       # Run all E2E tests
npm run test:e2e -- --ui  # Run with Playwright UI
```

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode with 100% type coverage
- **Components**: Functional components with TypeScript interfaces
- **API Routes**: Input validation with Zod, structured error handling
- **Database**: Repository pattern, transaction-wrapped operations
- **Testing**: Unit tests for utilities, integration tests for APIs

### Git Workflow
- **Branches**: `feature/feature-name` for new features
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)
- **PRs**: Required for all changes with code review
- **CI/CD**: Automatic testing and deployment via GitHub Actions

## Performance Considerations

### Optimization Strategies
- **Edge Runtime**: API routes run on Vercel Edge for global performance
- **Connection Pooling**: Efficient database connection management
- **Caching**: Appropriate cache headers for static assets
- **Bundle Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js automatic image optimization

### Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Database**: Query performance tracking with `pg_stat_statements`
- **Error Tracking**: Structured error logging and reporting

## Deployment

### Vercel Configuration
- **Platform**: Vercel with automatic GitHub integration
- **Build**: Turbopack for fast builds and deployments
- **Environment**: Production environment variables in Vercel dashboard
- **Domains**: Custom domain configuration in Vercel
- **Edge Functions**: API routes automatically deployed to edge

### CI/CD Pipeline
```yaml
# Automatic workflow:
1. Push to feature branch → Run tests
2. Create PR → Run full test suite
3. Merge to main → Deploy to production
4. Monitor deployment with Vercel Analytics
```

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npm run db:studio

# Reset database (development only)
npm run db:generate && npm run db:migrate
```

#### Authentication Issues
```bash
# Verify environment variables
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### Build Issues
```bash
# Clear all caches
rm -rf .next node_modules
npm install
npm run build
```

### Useful Commands for Debugging
```bash
# Check TypeScript errors
npm run type-check

# Lint and format code
npm run lint
npm run format

# Test specific files
npm run test -- user.test.ts
npm run test:e2e -- auth.spec.ts

# Database debugging
npm run db:studio  # Visual database browser
```

## Frontend Screen Specifications

### Screen Specification Management
Screen specifications define the detailed requirements for each user interface component and page.

### Specification Guidelines
- **Location**: Document screen specifications in project documentation
- **Naming Convention**: Use descriptive names for screen components and functions
- **API Integration**: Reference API endpoints and data types for backend integration
- **Data Types**: Use API data types (string, number, boolean) not database types (VARCHAR, INT)
- **Independence**: Screen specifications and API/function names don't need to match exactly

### Screen Documentation Standards
- **Clear Descriptions**: Detailed descriptions of screen behavior and functionality
- **User Stories**: Include user stories for context and requirements
- **Acceptance Criteria**: Define clear, testable completion criteria
- **Technical Requirements**: Specify technical constraints and dependencies
- **Error Handling**: Document error states and user feedback

### API Reference Guidelines
When writing frontend specifications:
- Always reference API documentation for data contracts
- Use API response formats for data type definitions
- Maintain clear separation between frontend UI and backend data models
- Allow frontend and backend to evolve independently while maintaining contracts

## Commit Guidelines

### Commit Message Standards
- Write commit messages in English
- Use conventional commit format: `type(scope): description`
- Include co-authorship when using Claude:
  ```
  🤖 Generated with [Claude Code](https://claude.ai/code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### Commit Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process or auxiliary tool changes

## Recent Updates

### 2024-10-26
- **Component Placement Rules**: Next.js 15 Pattern 3 documentation
  - Route-specific components: `app/[route]/_components/`
  - Multi-route domain components: `components/features/[domain]/`
  - App-wide components: `components/ui/`, `components/layouts/`
  - YAGNI principle: Start with route-specific, move only when actually reused

### 2024-10-04
- **ADR-005**: UIライブラリとデータテーブルの選定
  - shadcn/ui + Radix UI for UI components
  - TanStack Table v8 for data grid functionality
  - Complete free and open source stack

### 2024-10-03
- **ADR-001**: Next.js with Vercel Architecture - Core framework decisions
- **ADR-002**: Server-side Implementation Architecture - API and authentication design
- **ADR-003**: Database Integration with Vercel Postgres - Data layer implementation
- **ADR-004**: Development Guidelines and Best Practices - Comprehensive development standards

### Technology Stack Updates
- **Next.js**: Version 15.5.4 with App Router and Turbopack
- **React**: Version 19.1.0 (stable release)
- **UI Components**: shadcn/ui + Radix UI
- **Data Table**: TanStack Table v8
- **TypeScript**: Strict mode with 100% coverage requirement
- **Database**: Vercel Postgres with Drizzle ORM
- **Testing**: Vitest for unit tests, Playwright for E2E testing
- **Code Quality**: Biome for unified linting and formatting

### Development Infrastructure
- **CI/CD**: GitHub Actions with automatic Vercel deployment
- **Issue Management**: Structured templates for bugs and feature requests
- **Documentation**: Comprehensive ADRs and technical guidelines
- **Testing Strategy**: Multi-layered testing approach with coverage requirements

## GitHub Issue Management

### Issue Templates
This project provides structured Issue templates for efficient project management:

#### 🐛 Bug Report (`bug_report.yml`)
- **Purpose**: Report bugs or unexpected behavior
- **Labels**: `bug`, `needs-triage`
- **Required Info**: Description, reproduction steps, environment details
- **Severity Levels**: Critical, High, Medium, Low
- **Component Categories**: Authentication, User Management, Tasks, Projects, API, Database, UI, Build, Performance

#### ✨ Feature Request (`feature_request.yml`)
- **Purpose**: Suggest new features or enhancements
- **Labels**: `enhancement`, `needs-discussion`
- **Required Info**: Problem statement, proposed solution, acceptance criteria
- **Priority Levels**: High, Medium, Low
- **Implementation Considerations**: Database changes, API changes, authentication impact, UI/UX requirements

### Issue Creation Guidelines

#### Bug Reports
- **Pre-submission**: Search existing issues, read documentation, ensure reproducibility
- **Environment Info**: OS, browser, Node.js version, Next.js version, database version
- **Error Logs**: Include browser console errors and server-side logs
- **Screenshots**: Visual evidence when applicable

#### Feature Requests
- **Problem-First**: Clearly define the problem before proposing solutions
- **Acceptance Criteria**: Define testable completion criteria
- **Technical Impact**: Consider database, API, authentication, and performance implications
- **Mockups**: Include wireframes or visual examples when relevant

### Label System

#### Bug Classification
- `bug` - Confirmed bugs
- `needs-triage` - Requires initial review
- Severity: `critical`, `high`, `medium`, `low`

#### Feature Classification
- `enhancement` - New features or improvements
- `needs-discussion` - Requires team discussion
- Priority: `priority:high`, `priority:medium`, `priority:low`

#### Component Labels
- `frontend` - UI/Client-side issues
- `backend` - API/Server-side issues
- `database` - Database-related issues
- `authentication` - Auth/security issues
- `api` - API design/implementation
- `ui` - User interface/experience
- `performance` - Performance optimization
- `documentation` - Documentation updates

### Issue Workflow
1. **Creation**: Use appropriate template
2. **Triage**: Team reviews and assigns labels
3. **Discussion**: Technical discussion and clarification
4. **Planning**: Break down into tasks if needed
5. **Implementation**: Development work
6. **Review**: Code review and testing
7. **Closure**: Issue resolved and closed

## Additional Resources

### Documentation
- [Architecture Decision Records](./docs/adr/README.md) - Technical decisions and rationale
- [Next.js App Router](https://nextjs.org/docs/app) - Framework documentation
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM documentation
- [NextAuth.js v5](https://authjs.dev/) - Authentication library

### Development Tools
- **Drizzle Studio**: Visual database browser (`npm run db:studio`)
- **Vercel Dashboard**: Deployment and analytics monitoring
- **Biome**: Code quality and formatting
- **Playwright**: End-to-end testing framework

## Development Quality Requirements

### Mandatory CI/Test Verification
**CRITICAL**: Every code modification MUST pass CI and tests before completion.

#### Pre-completion Checklist
1. **Type Check**: `npm run type-check` - Must pass without errors
2. **Linting**: `npm run lint` - Must pass without errors  
3. **Unit Tests**: `npm run test` - All tests must pass
4. **Build**: `npm run build` - Must complete successfully
5. **Format Check**: `npm run format` - Code must be properly formatted

#### Workflow Requirements
- Run all quality checks after every significant change
- Fix any failures before considering the task complete
- Never commit or deploy code that fails CI/tests
- If unable to fix failures, document the issue and ask for guidance

#### Available Commands
```bash
# Quick quality check (run all at once)
npm run lint && npm run type-check && npm run test && npm run build

# Individual checks
npm run type-check    # TypeScript type validation
npm run lint          # Biome linting and formatting
npm run test          # Unit and integration tests
npm run test:e2e      # End-to-end tests (when needed)
npm run build         # Production build verification
npm run format        # Auto-format code
```

#### CI Pipeline Integration
- GitHub Actions automatically runs these checks on PR creation
- All checks must pass before merge is allowed
- Local verification prevents CI failures and reduces iteration time

---

**Last Updated**: 2024-10-26
**Claude Instructions**: Use this context to understand the project structure, available commands, and development patterns. Always check ADRs for detailed technical decisions. When creating or reviewing Issues, follow the established templates and labeling system. Refer to the comprehensive testing guidelines and component architecture standards for development work.