#!/bin/bash

# Pre-deployment integrity check script
# This script runs comprehensive checks before deployment

set -e  # Exit on any error

echo "🚀 Starting Pre-Deployment Integrity Check..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Build the project
print_status "Building the project..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Project built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 3: Run linting
print_status "Running linting checks..."
npm run lint
if [ $? -eq 0 ]; then
    print_success "Linting passed"
else
    print_warning "Linting issues found - consider fixing before deployment"
fi

# Step 4: Run tests
print_status "Running test suite..."
npm run test
if [ $? -eq 0 ]; then
    print_success "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# Step 5: Run integrity check
print_status "Running system integrity check..."
npm run check-integrity -- --exit-on-issues --format text
INTEGRITY_EXIT_CODE=$?

if [ $INTEGRITY_EXIT_CODE -eq 0 ]; then
    print_success "Integrity check passed"
else
    print_error "Integrity check failed - deployment not recommended"
    
    # Ask user if they want to continue despite issues
    echo ""
    read -p "Do you want to continue with deployment despite integrity issues? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled due to integrity issues"
        exit 1
    else
        print_warning "Proceeding with deployment despite integrity issues"
    fi
fi

# Step 6: Generate deployment report
REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).json"
print_status "Generating deployment report..."

npm run check-integrity -- --format json --output "$REPORT_FILE"
if [ $? -eq 0 ]; then
    print_success "Deployment report generated: $REPORT_FILE"
else
    print_warning "Failed to generate deployment report"
fi

# Step 7: Final checks
print_status "Running final deployment readiness checks..."

# Check if essential files exist
ESSENTIAL_FILES=(
    "package.json"
    "packages/api-server/dist/index.js"
    "packages/web-dashboard/dist/index.html"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
        exit 1
    fi
done

# Check environment variables (if .env.example exists)
if [ -f ".env.example" ]; then
    print_status "Checking environment configuration..."
    if [ -f ".env" ]; then
        print_success "Environment file found"
    else
        print_warning "No .env file found - make sure environment variables are configured"
    fi
fi

echo ""
echo "================================================"
print_success "🎉 Pre-deployment check completed successfully!"
echo ""
print_status "Deployment Summary:"
echo "  - Dependencies: ✓ Installed"
echo "  - Build: ✓ Successful"
echo "  - Tests: ✓ Passed"
echo "  - Integrity: ✓ Checked"
echo "  - Report: ✓ Generated ($REPORT_FILE)"
echo ""
print_status "Your application is ready for deployment! 🚀"
echo "================================================"