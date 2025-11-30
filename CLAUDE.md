# Work Management - Claude Project Context

## Project Overview
Next.js 15 work management app with task management, user collaboration, and project organization. Deployed on Vercel with Postgres.

## Documentation
- **ADRs**: `docs/adr/` - Architecture Decision Records (Japanese)
- **API Docs**: `docs/api/` - API specifications
- **DB Docs**: `docs/database/` - Schema documentation

### Language Guidelines
- **English**: Code, comments, commit messages
- **Japanese**: ADR documentation

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript 5+, shadcn/ui, TanStack Table v8, Tailwind CSS 4 |
| Backend | Next.js API Routes, NextAuth.js v5, Zod validation |
| Database | Vercel Postgres, Drizzle ORM |
| Tools | Biome, Vitest, Playwright |

## Directory Structure
```
app/                    # Next.js App Router
├── api/               # API Routes
├── [locale]/          # i18n routes
lib/                   # Utilities
├── db/repositories/   # Repository pattern
components/            # React components
├── ui/               # shadcn/ui
drizzle/              # Schema and migrations
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Biome linting
npm run type-check       # TypeScript check

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Apply migrations
npm run db:seed          # Seed data

# Testing
npm run test             # Unit tests
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Quality (run before commit)
npm run lint && npm run type-check && npm run test && npm run build
```

## Environment Variables

```bash
POSTGRES_URL=             # Database connection
NEXTAUTH_SECRET=          # JWT signing secret
NEXTAUTH_URL=             # App URL
DISABLE_AUTH=false        # Dev only: bypass auth
```

## API Design

Standard response format:
```typescript
{ success: boolean, data?: T, error?: { code, message }, pagination?: {...} }
```

HTTP status: 200/201/204 success, 400/401/403/404/500 errors.

## AG Grid Standards (ADR-006)

**Required**: Use `gridApi.applyTransaction()` for data modifications, AG Grid as single source of truth.

**Prohibited**: Duplicate state with useState, toast in valueParser, complex custom event handling.

## Component Placement (Next.js 15)

1. **Route-specific**: `app/[route]/_components/`
2. **Multi-route**: `components/features/[domain]/`
3. **App-wide**: `components/ui/`, `components/layouts/`

## Coding Standards

- TypeScript strict mode, 100% type coverage
- Functional components with proper interfaces
- Zod validation for all API inputs
- Repository pattern for database access
- Conventional commits: `feat:`, `fix:`, `docs:`

## Quality Requirements

**Before commit**, all must pass:
1. `npm run lint`
2. `npm run type-check`
3. `npm run test:coverage`

## Commit Format

```
type(scope): description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Email Configuration

- **Development**: Mailpit (Docker, port 1025/8025)
- **Production**: Resend

See `docker-compose.yml` and environment variables for setup.

## Troubleshooting

```bash
# Database issues
npm run db:studio

# Build issues
rm -rf .next node_modules && npm install && npm run build

# Auth issues
# Check NEXTAUTH_SECRET and NEXTAUTH_URL
```

## Additional Resources

- [ADR Index](./docs/adr/README.md)
- [Next.js Docs](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/)
