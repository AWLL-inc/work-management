# Authentication Setup Guide

This guide explains how to set up and run the authentication system for the first time.

## Prerequisites

- Node.js 18+ installed
- Vercel Postgres database provisioned
- PostgreSQL connection strings available

## Step 1: Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required environment variables in `.env.local`:

   ```bash
   # Database (Vercel Postgres)
   POSTGRES_URL=postgres://...
   POSTGRES_URL_NON_POOLING=postgres://...

   # NextAuth.js v5
   # Generate secret: openssl rand -base64 32
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

### Generating NEXTAUTH_SECRET

Run the following command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 2: Database Setup

1. **Generate migration files** (already done):
   ```bash
   npm run db:generate
   ```

2. **Run migrations** to create tables:
   ```bash
   npm run db:push
   ```

   This will create the following tables:
   - `users` - User accounts with roles
   - `accounts` - OAuth provider accounts
   - `sessions` - User sessions
   - `verification_tokens` - Email verification tokens

3. **Seed test users**:
   ```bash
   npm run db:seed
   ```

   This creates three test users:
   - **Admin**: `admin@example.com` / `admin123`
   - **Manager**: `manager@example.com` / `manager123`
   - **User**: `user@example.com` / `user123`

## Step 3: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 4: Test Authentication

1. Navigate to http://localhost:3000/login
2. Sign in with one of the test accounts:
   - Email: `user@example.com`
   - Password: `user123`
3. You should be redirected to http://localhost:3000/dashboard
4. Verify your session information is displayed

## Authentication Routes

- `/login` - Sign in page
- `/dashboard` - Protected dashboard (requires authentication)
- `/api/auth/[...nextauth]` - NextAuth.js API routes

## Database Management

### View database with Drizzle Studio

```bash
npm run db:studio
```

This opens a web interface at http://localhost:4983 to browse your database.

### Reset database (development only)

```bash
# Drop all tables and re-create
npm run db:push -- --force

# Re-seed with test users
npm run db:seed
```

## Troubleshooting

### "Invalid email or password" error

- Ensure you've run `npm run db:seed` to create test users
- Check that POSTGRES_URL is correctly set in `.env.local`
- Verify database connection with `npm run db:studio`

### "NEXTAUTH_SECRET is not set" error

- Make sure you've added NEXTAUTH_SECRET to `.env.local`
- Restart the development server after adding environment variables

### TypeScript errors

```bash
# Install dependencies
npm install

# Restart TypeScript server in your editor
```

## Next Steps

- Issue #1: Database schema for work logs
- Issue #2: Project master API
- Issue #3: Work log CRUD API

## Security Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- Use strong passwords in production
- Rotate NEXTAUTH_SECRET periodically
- Enable HTTPS in production (automatic on Vercel)

## Architecture

- **Framework**: Next.js 15 App Router
- **Auth Library**: NextAuth.js v5 (Auth.js)
- **Database**: Vercel Postgres (PostgreSQL 15+)
- **ORM**: Drizzle ORM with Drizzle Adapter
- **Password Hashing**: bcryptjs (10 salt rounds)
- **Session Strategy**: JWT (for edge compatibility)

## References

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Issue #8: Authentication Infrastructure](https://github.com/AWLL-inc/work-management/issues/8)
