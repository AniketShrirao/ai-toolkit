#!/bin/bash

# AI Toolkit Documentation Deployment Script
# This script builds and deploys the documentation site for static hosting

set -e

echo "🚀 Starting deployment process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint code
echo "🔧 Running linter..."
npm run lint

# Build the site
echo "🏗️  Building the site..."
npm run build:static

# Verify build output
if [ ! -d "out" ]; then
    echo "❌ Build failed - no output directory found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Static files are ready in the 'out' directory"

# Optional: Deploy to specific hosting services
# Uncomment and configure as needed:

# Deploy to Netlify
# if command -v netlify &> /dev/null; then
#     echo "🌐 Deploying to Netlify..."
#     netlify deploy --prod --dir=out
# fi

# Deploy to Vercel
# if command -v vercel &> /dev/null; then
#     echo "🌐 Deploying to Vercel..."
#     vercel --prod
# fi

# Deploy to GitHub Pages
# if [ "$GITHUB_ACTIONS" = "true" ]; then
#     echo "🌐 Deploying to GitHub Pages..."
#     # GitHub Actions will handle the deployment
# fi

echo "🎉 Deployment process completed!"