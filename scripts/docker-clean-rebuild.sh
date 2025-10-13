#!/bin/bash

# Docker環境を完全にクリーンアップして再ビルドするスクリプト

echo "🧹 Stopping and removing containers..."
docker compose down

echo "🗑️ Removing volumes (node_modules, .next, postgres data)..."
docker volume rm work-management_node_modules_volume 2>/dev/null || true
docker volume rm work-management_next_build_volume 2>/dev/null || true

echo "🧹 Cleaning up Docker cache..."
docker system prune -f

echo "🔨 Building fresh containers..."
docker compose build --no-cache

echo "🚀 Starting services..."
docker compose up -d

echo "📦 Installing dependencies in container..."
docker compose exec app npm install

echo "✅ Docker environment rebuilt successfully!"
echo "🌐 Application should be available at http://localhost:3000"