# Work Management Project Makefile
# Commands for easy development workflow

.PHONY: help build up down clean migrate seed test lint format type-check install dev logs restart

# Default target
help:
	@echo "Work Management Project Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install dependencies with pnpm"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build the application for production"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make up          - Start all services with Docker Compose"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Show logs from all services"
	@echo "  make restart     - Restart all services"
	@echo ""
	@echo "Database Commands:"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with sample data"
	@echo "  make db-studio   - Open Drizzle Studio (database GUI)"
	@echo "  make db-generate - Generate new migration files"
	@echo ""
	@echo "Code Quality:"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linting with Biome"
	@echo "  make format      - Format code with Biome"
	@echo "  make type-check  - Run TypeScript type checking"
	@echo "  make quality     - Run all quality checks (lint + type-check + test)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       - Clean build artifacts and dependencies"
	@echo "  make clean-hard  - Clean everything including Docker volumes"

# Development Commands
install:
	@echo "Installing dependencies with pnpm..."
	pnpm install

dev: install
	@echo "Starting development server..."
	pnpm dev

build:
	@echo "Building application for production..."
	pnpm build

# Docker Commands
up:
	@echo "Starting all services with Docker Compose..."
	docker-compose up -d

down:
	@echo "Stopping all services..."
	docker-compose down

logs:
	@echo "Showing logs from all services..."
	docker-compose logs -f

restart: down up
	@echo "Restarting all services..."

# Database Commands
migrate:
	@echo "Running database migrations..."
	pnpm run db:migrate

seed: migrate
	@echo "Seeding database with sample data..."
	pnpm run db:seed

db-studio:
	@echo "Opening Drizzle Studio..."
	pnpm run db:studio

db-generate:
	@echo "Generating new migration files..."
	pnpm run db:generate

# Code Quality Commands
test:
	@echo "Running all tests..."
	pnpm test

test-e2e:
	@echo "Running end-to-end tests..."
	pnpm run test:e2e

lint:
	@echo "Running linting with Biome..."
	pnpm run lint

format:
	@echo "Formatting code with Biome..."
	pnpm run format

type-check:
	@echo "Running TypeScript type checking..."
	pnpm run type-check

quality: lint type-check test build
	@echo "All quality checks completed successfully!"

# Maintenance Commands
clean:
	@echo "Cleaning build artifacts and dependencies..."
	rm -rf .next
	rm -rf node_modules
	rm -rf dist
	rm -rf .turbo

clean-hard: clean down
	@echo "Performing hard clean (including Docker volumes)..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Documentation Commands
docs:
	@echo "Generating all documentation..."
	pnpm run docs

docs-db:
	@echo "Generating database documentation..."
	pnpm run docs:db

docs-api:
	@echo "Generating API documentation..."
	pnpm run docs:openapi

# Production Commands
start:
	@echo "Starting production server..."
	pnpm start

# Development with specific services
up-db:
	@echo "Starting only database services..."
	docker-compose up -d postgres mailpit

up-mail:
	@echo "Starting only Mailpit for email testing..."
	docker-compose up -d mailpit

# Quick setup for new developers
setup: install up-db migrate seed
	@echo "Project setup completed!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Copy .env.example to .env.local and configure your environment variables"
	@echo "2. Run 'make dev' to start the development server"
	@echo "3. Visit http://localhost:3000 to view the application"
	@echo "4. Visit http://localhost:8025 for Mailpit email testing"

# CI/CD Commands
ci: install quality
	@echo "CI pipeline completed successfully!"

# Debugging Commands
debug-env:
	@echo "Current environment variables:"
	@env | grep -E "(NODE_ENV|POSTGRES_|NEXTAUTH_|EMAIL_)" || true

debug-docker:
	@echo "Docker containers status:"
	docker-compose ps
	@echo ""
	@echo "Docker logs (last 50 lines):"
	docker-compose logs --tail=50

# Package management
update-deps:
	@echo "Updating all dependencies..."
	pnpm update

check-outdated:
	@echo "Checking for outdated packages..."
	pnpm outdated