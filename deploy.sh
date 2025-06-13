#!/bin/bash

# Multi-Channel Customer Service Hub - Production Deployment Script
set -e

echo "🚀 Starting deployment of Customer Service Hub..."

# Check required environment variables
required_vars=("DATABASE_URL" "SESSION_SECRET" "REPL_ID" "REPLIT_DOMAINS")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Applying database migrations..."
npm run db:push

# Create logs directory
mkdir -p logs

# Set proper permissions
chmod 755 logs

# Run health check
echo "❤️ Running health check..."
timeout 30s bash -c 'until curl -f http://localhost:5000/health; do sleep 2; done' || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Health check passed"

echo "🎉 Deployment completed successfully!"
echo "📊 Application is running on port 5000"
echo "🏥 Health check available at /health"
echo "📈 Monitoring dashboard available at /api/admin/cache-stats"