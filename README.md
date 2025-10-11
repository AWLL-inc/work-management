# Work Management

[![CI/CD Pipeline](https://github.com/AWLL-inc/work-management/actions/workflows/ci.yml/badge.svg)](https://github.com/AWLL-inc/work-management/actions/workflows/ci.yml)

Modern work management application built with Next.js 15, featuring task management, user collaboration, and project organization capabilities.

## 🚀 Quick Start

### Option 1: Docker (Recommended for Quick Setup)

**Prerequisites**: Docker Desktop or Docker Engine

```bash
# 1. Copy environment file
cp .env.docker.example .env.docker

# 2. Update NEXTAUTH_SECRET in .env.docker
# Generate with: openssl rand -base64 32

# 3. Start services
npm run docker:dev:build

# 4. Run migrations (first time only)
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed

# 5. Access application
# http://localhost:3000
```

**Test Accounts**:
- Admin: `admin@example.com` / `admin123`
- Manager: `manager@example.com` / `manager123`
- User: `user@example.com` / `user123`

📖 **Full Docker Guide**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md)

### Option 2: Local Development

**Prerequisites**: Node.js 18+, PostgreSQL

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Update database credentials and NEXTAUTH_SECRET

# 3. Run migrations
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev

# 5. Access application
# http://localhost:3000
```

📖 **Authentication Guide**: See [AUTH_SETUP.md](./AUTH_SETUP.md)

## 📋 Features

- ✅ **Authentication**: NextAuth.js v5 with Email/Password
- ✅ **Database**: PostgreSQL with Drizzle ORM
- ✅ **Role-Based Access**: Admin, Manager, User roles
- 🚧 **Work Logs**: Time tracking and work management (Coming soon)
- 🚧 **Projects**: Project organization (Coming soon)
- 🚧 **Dashboard**: Analytics and insights (Coming soon)

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5+ (strict mode)
- **UI Components**: shadcn/ui + Radix UI
- **Data Table**: TanStack Table v8
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack

### Backend
- **API**: Next.js API Routes (Edge Runtime)
- **Authentication**: NextAuth.js v5
- **Database**: Vercel Postgres (PostgreSQL 15+)
- **ORM**: Drizzle ORM
- **Validation**: Zod

### Development Tools
- **Linting/Formatting**: Biome
- **Testing**: Vitest (unit), Playwright (E2E)
- **Docker**: Multi-stage builds for dev/prod
- **CI/CD**: GitHub Actions + Vercel + Claude Code Review

## 📁 Project Structure

```
work-management/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── login/             # Login page
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── lib/                   # Shared utilities
│   ├── db/               # Database connection
│   ├── auth.ts           # NextAuth config
│   └── auth-helpers.ts   # Auth utilities
├── drizzle/              # Database schema & migrations
│   ├── schema.ts
│   ├── migrations/
│   └── seed.ts
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── data-table/      # TanStack Table
├── docker/              # Docker scripts
├── docs/adr/            # Architecture Decision Records
└── types/               # TypeScript types
```

## 🐳 Docker Commands

```bash
# Development
npm run docker:dev              # Start dev environment
npm run docker:dev:build        # Rebuild and start
npm run docker:dev:down         # Stop all services

# Production
npm run docker:prod:build       # Build and run production

# Utilities
docker-compose logs -f app      # View app logs
docker-compose exec app sh      # Access container shell
```

## 🗄️ Database Commands

```bash
# Migrations
npm run db:generate             # Generate migration files
npm run db:push                 # Push schema to database
npm run db:migrate              # Run migrations

# Management
npm run db:studio               # Open Drizzle Studio (GUI)
npm run db:seed                 # Seed test data
```

## 🧪 Testing Commands

```bash
npm run test                    # Run unit tests
npm run test:watch              # Watch mode
npm run test:e2e                # E2E tests
npm run test:coverage           # Coverage report
```

## 🤖 AI Code Review (Claude Code)

### 自動レビュー機能

プルリクエストが作成されると、自動的に Claude Code によるコードレビューが実行されます。

**レビュー対象**:
- TypeScript/React/Next.js 15 のコーディング基準
- プロジェクト固有のADR準拠チェック
- セキュリティとパフォーマンスの検証
- Issue仕様との整合性確認

**設定要件**:
```bash
# GitHub Secrets に設定が必要
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**レビュー機能**:
- 📊 PR概要コメント（総合スコア付き）
- 💬 インラインコメント（具体的な改善提案）
- 🎯 Issue仕様準拠チェック
- 📋 ADR準拠検証

**手動実行**:
```bash
# GitHub Actions から手動でトリガー可能
# Actions タブ → "Claude Code Review" → "Run workflow"
```

## 📚 Documentation

- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Complete Docker setup guide
- **[AUTH_SETUP.md](./AUTH_SETUP.md)** - Authentication setup guide
- **[CLAUDE.md](./CLAUDE.md)** - Project context for Claude
- **[docs/adr/](./docs/adr/)** - Architecture Decision Records

## 🔧 Configuration Files

- `next.config.ts` - Next.js configuration
- `drizzle.config.ts` - Database ORM configuration
- `middleware.ts` - Authentication middleware
- `biome.json` - Linting & formatting rules
- `docker-compose.yml` - Development services
- `docker-compose.prod.yml` - Production services

## 🌐 Environment Variables

### Required Variables

```bash
# Database
POSTGRES_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

# NextAuth.js
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000
```

See `.env.example` (local) or `.env.docker.example` (Docker) for details.

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker Production
```bash
# Build and deploy
npm run docker:prod:build
```

## 🐛 Troubleshooting

### Docker Issues
- **Slow HMR on Windows**: Use WSL 2, clone repo inside WSL filesystem
- **Port conflicts**: Change ports in `docker-compose.yml`
- **Database connection**: Check `docker-compose logs db`

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Ensure database is running
- Check `npm run db:seed` has been executed

### Build Issues
```bash
# Clear caches
rm -rf .next node_modules
npm install
npm run build
```

## 📊 Project Status

### Completed ✅
- [x] Authentication infrastructure (NextAuth.js v5)
- [x] Database schema (Users, Auth tables)
- [x] Docker development environment
- [x] ADRs and documentation

### In Progress 🚧
- [ ] Work logs database schema (#1)
- [ ] Project master API (#2)
- [ ] Work logs CRUD API (#3)
- [ ] UI foundation setup (#4)
- [ ] Work logs page (#5)

### Planned 📅
- [ ] Rich text editor integration (#6)
- [ ] Dashboard and analytics
- [ ] Export functionality

## 🤝 Contributing

1. Create feature branch: `feature/feature-name`
2. Follow conventional commits: `feat:`, `fix:`, `docs:`
3. Run tests and linting: `npm run test && npm run lint`
4. Submit pull request

## 📄 License

Private project - All rights reserved

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://authjs.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Issues](https://github.com/AWLL-inc/work-management/issues)

---

**Last Updated**: 2025-10-04
**Version**: 0.1.0
