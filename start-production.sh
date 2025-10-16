#!/bin/bash

# BizMetrics Production Startup Script
# This script starts the BizMetrics application in production mode

set -e  # Exit on any error

echo "🚀 Starting BizMetrics in Production Mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create a .env file with required environment variables:"
    echo "  - DATABASE_URL"
    echo "  - SESSION_SECRET"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  Warning: SESSION_SECRET is not set. Using default (not secure for production)"
    export SESSION_SECRET="default-secret-change-in-production"
fi

# Set production environment
export NODE_ENV=production

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

echo "✅ Environment configured"
echo "✅ Database: $DATABASE_URL"
echo "✅ Build files found"

# Start the application
echo "🌟 Starting BizMetrics server on port 5000..."
node dist/index.js
