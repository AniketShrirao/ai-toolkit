# Pre-deployment integrity check script (PowerShell version)
# This script runs comprehensive checks before deployment

param(
    [switch]$Force = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Pre-Deployment Integrity Check..." -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Please run this script from the project root."
        exit 1
    }

    # Step 1: Install dependencies
    Write-Status "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }

    # Step 2: Build the project
    Write-Status "Building the project..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Project built successfully"
    } else {
        Write-Error "Build failed"
        exit 1
    }

    # Step 3: Run linting
    Write-Status "Running linting checks..."
    npm run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Linting passed"
    } else {
        Write-Warning "Linting issues found - consider fixing before deployment"
    }

    # Step 4: Run tests
    Write-Status "Running test suite..."
    npm run test
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All tests passed"
    } else {
        Write-Error "Tests failed"
        exit 1
    }

    # Step 5: Run integrity check
    Write-Status "Running system integrity check..."
    npm run check-integrity -- --exit-on-issues --format text
    $IntegrityExitCode = $LASTEXITCODE

    if ($IntegrityExitCode -eq 0) {
        Write-Success "Integrity check passed"
    } else {
        Write-Error "Integrity check failed - deployment not recommended"
        
        if (-not $Force) {
            # Ask user if they want to continue despite issues
            Write-Host ""
            $response = Read-Host "Do you want to continue with deployment despite integrity issues? (y/N)"
            if ($response -notmatch "^[Yy]$") {
                Write-Error "Deployment cancelled due to integrity issues"
                exit 1
            } else {
                Write-Warning "Proceeding with deployment despite integrity issues"
            }
        } else {
            Write-Warning "Force flag set - proceeding despite integrity issues"
        }
    }

    # Step 6: Generate deployment report
    $ReportFile = "deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Write-Status "Generating deployment report..."

    npm run check-integrity -- --format json --output $ReportFile
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment report generated: $ReportFile"
    } else {
        Write-Warning "Failed to generate deployment report"
    }

    # Step 7: Final checks
    Write-Status "Running final deployment readiness checks..."

    # Check if essential files exist
    $EssentialFiles = @(
        "package.json",
        "packages/api-server/dist/index.js",
        "packages/web-dashboard/dist/index.html"
    )

    foreach ($file in $EssentialFiles) {
        if (Test-Path $file) {
            Write-Success "✓ $file exists"
        } else {
            Write-Error "✗ $file missing"
            exit 1
        }
    }

    # Check environment variables (if .env.example exists)
    if (Test-Path ".env.example") {
        Write-Status "Checking environment configuration..."
        if (Test-Path ".env") {
            Write-Success "Environment file found"
        } else {
            Write-Warning "No .env file found - make sure environment variables are configured"
        }
    }

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Success "🎉 Pre-deployment check completed successfully!"
    Write-Host ""
    Write-Status "Deployment Summary:"
    Write-Host "  - Dependencies: ✓ Installed"
    Write-Host "  - Build: ✓ Successful"
    Write-Host "  - Tests: ✓ Passed"
    Write-Host "  - Integrity: ✓ Checked"
    Write-Host "  - Report: ✓ Generated ($ReportFile)"
    Write-Host ""
    Write-Status "Your application is ready for deployment! 🚀"
    Write-Host "================================================" -ForegroundColor Blue

} catch {
    Write-Error "Pre-deployment check failed: $($_.Exception.Message)"
    exit 1
}