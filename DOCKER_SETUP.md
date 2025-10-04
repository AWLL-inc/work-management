# Docker Setup Guide

Complete guide for running Work Management application with Docker on Windows, Mac, and Linux.

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Mac: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)
- **Docker Compose** v2.0+ (included with Docker Desktop)

### System Requirements
- **Windows**: WSL 2 required for optimal performance
- **Mac**: Docker Desktop with VirtioFS enabled (default)
- **Linux**: Native Docker support

### Verify Installation
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/AWLL-inc/work-management.git
cd work-management
```

### 2. Environment Setup
```bash
# Copy Docker environment template
cp .env.docker.example .env.docker

# Generate NEXTAUTH_SECRET
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
# [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Update .env.docker with the generated secret
```

### 3. Start Development Environment
```bash
# Start all services (app + database)
npm run docker:dev

# Or use docker-compose directly
docker-compose up

# Run in background (detached mode)
docker-compose up -d
```

### 4. Database Migration (First Time Only)
```bash
# Wait for services to start, then run:
docker-compose exec app npm run db:push

# Seed test data
docker-compose exec app npm run db:seed
```

### 5. Access Application
- **Application**: http://localhost:3000
- **Database**: localhost:5432
  - User: `postgres`
  - Password: `postgres`
  - Database: `work_management`

### 6. Login
Use one of the test accounts:
- Admin: `admin@example.com` / `admin123`
- Manager: `manager@example.com` / `manager123`
- User: `user@example.com` / `user123`

## 🛠️ Development Workflow

### Hot Module Replacement (HMR)
The development container supports hot reloading:
- Edit files in your local directory
- Changes are automatically detected
- Browser refreshes with updates (Turbopack)

### View Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f db
```

### Execute Commands in Container
```bash
# Run any npm command
docker-compose exec app npm run lint
docker-compose exec app npm run format

# Access container shell
docker-compose exec app sh

# Run database migrations
docker-compose exec app npm run db:push
docker-compose exec app npm run db:generate
```

### Database Management
```bash
# Open Drizzle Studio (in container)
docker-compose exec app npm run db:studio
# Access at: http://localhost:4983

# Connect with external tools
# Host: localhost
# Port: 5432
# User: postgres
# Password: postgres
# Database: work_management
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (database data)
docker-compose down -v
```

## 🏭 Production Deployment

### 1. Environment Configuration
```bash
# Copy production template
cp .env.docker.example .env.docker.prod

# Update production values:
# - NEXTAUTH_SECRET (strong secret)
# - NEXTAUTH_URL (your domain)
# - POSTGRES_PASSWORD (secure password)
```

### 2. Build and Run
```bash
# Build and start production
npm run docker:prod:build

# Or use docker-compose directly
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. Production Features
- **Standalone Build**: Minimal image size (~150MB)
- **Non-root User**: Enhanced security
- **Health Checks**: Automatic recovery
- **Optimized Layers**: Fast rebuilds

## 📁 Project Structure

```
work-management/
├── Dockerfile                  # Multi-stage Dockerfile
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
├── .dockerignore              # Build exclusions
├── .env.docker.example        # Environment template
├── docker/
│   └── init-db.sh             # Database initialization
└── DOCKER_SETUP.md            # This file
```

## 🔧 Configuration Files

### Dockerfile Stages
1. **base**: Common setup (Node.js 22 Alpine)
2. **deps**: Dependencies installation
3. **development**: HMR + Turbopack
4. **builder**: Production build
5. **production**: Minimal runtime (~150MB)

### docker-compose.yml Services
- **app**: Next.js application (port 3000)
- **db**: PostgreSQL 15 (port 5432)

### Volumes
- `postgres_data`: Database persistence
- Source code mount: Live reload in development
- Node modules exclusion: Prevent overwrites

## 🐛 Troubleshooting

### Issue: Port Already in Use
```bash
# Find process using port 3000
# Mac/Linux:
lsof -i :3000

# Windows (PowerShell):
netstat -ano | findstr :3000

# Stop existing containers
docker-compose down
```

### Issue: Database Connection Failed
```bash
# Check database health
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Issue: Slow HMR on Windows
**Solution**: Enable WSL 2
1. Install WSL 2: https://docs.microsoft.com/windows/wsl/install
2. Clone repo inside WSL filesystem (`\\wsl$\Ubuntu\home\...`)
3. Run Docker from WSL terminal

### Issue: Permission Denied (Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
```

### Issue: Out of Disk Space
```bash
# Remove unused images
docker system prune -a

# Remove volumes (WARNING: deletes data)
docker volume prune
```

### Issue: Changes Not Reflected
```bash
# Rebuild images
docker-compose up --build

# Clear Next.js cache
docker-compose exec app rm -rf .next
docker-compose restart app
```

## 🔄 Reset Environment

### Soft Reset (Keep Database)
```bash
docker-compose down
docker-compose up -d
```

### Hard Reset (Delete Everything)
```bash
# Stop and remove all
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

## 📊 Performance Tips

### Windows (WSL 2)
- Clone repository inside WSL filesystem
- Use WSL 2 backend in Docker Desktop
- Enable VirtioFS for better file sync

### Mac
- Enable VirtioFS in Docker Desktop settings
- Allocate sufficient resources (Settings > Resources)
  - CPUs: 4+
  - Memory: 4GB+

### Linux
- Native performance (no VM overhead)
- Use overlay2 storage driver
- Enable BuildKit: `export DOCKER_BUILDKIT=1`

## 🔒 Security Best Practices

### Development
- ✅ Default credentials (postgres/postgres)
- ✅ Exposed ports (3000, 5432)
- ✅ Debug logging enabled

### Production
- ✅ Strong passwords in `.env.docker.prod`
- ✅ Non-root user (nextjs:1001)
- ✅ Minimal attack surface (standalone)
- ✅ No exposed database port (remove from prod compose)
- ✅ HTTPS termination (use reverse proxy)

## 🎯 Next Steps

### After Setup
1. **Authentication**: Test login with seed users
2. **Database**: Verify schema with Drizzle Studio
3. **Development**: Start building features

### Recommended Tools
- **Database GUI**: DBeaver, pgAdmin, TablePlus
- **API Testing**: Postman, Insomnia, Thunder Client
- **Container Monitoring**: Docker Desktop Dashboard

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Guide](https://nextjs.org/docs/app/guides/deploying#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Issue #9: Docker Infrastructure](https://github.com/AWLL-inc/work-management/issues/9)

## 🆘 Getting Help

### Check Logs First
```bash
docker-compose logs -f
```

### Common Commands
```bash
# Service status
docker-compose ps

# Resource usage
docker stats

# Network inspection
docker network ls
docker network inspect work-management_app-network
```

### Still Having Issues?
1. Check GitHub Issues: [AWLL-inc/work-management/issues](https://github.com/AWLL-inc/work-management/issues)
2. Review logs: `docker-compose logs -f`
3. Verify environment: `docker-compose config`
4. Reset and retry: `docker-compose down -v && docker-compose up --build`

---

**Last Updated**: 2025-10-04
**Docker Version**: 24.0+
**Compose Version**: v2.0+
