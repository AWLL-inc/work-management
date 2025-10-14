# Dockerfile for Next.js 15 Application
# Multi-stage build for development and production

# ============================================
# Base stage - Common setup for all stages
# ============================================
FROM node:22-alpine AS base

# Install dependencies and build tools
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Set environment to production by default
ENV NODE_ENV=production

# ============================================
# Dependencies stage - Install all dependencies
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# ============================================
# Development stage - For local development with HMR
# ============================================
FROM base AS development

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set environment to development
ENV NODE_ENV=development

# Expose port 3000
EXPOSE 3000

# Start development server with Turbopack
CMD ["npm", "run", "dev"]

# ============================================
# Builder stage - Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
# This will create .next/standalone directory
RUN pnpm run build

# ============================================
# Production stage - Minimal production image
# ============================================
FROM base AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Copy standalone output (contains only necessary files)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy .next/static folder for client-side assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
