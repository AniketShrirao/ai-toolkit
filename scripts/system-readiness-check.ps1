# AI Toolkit System Readiness Check - PowerShell Version
param(
    [switch]$CheckServer,
    [string]$Environment = $env:NODE_ENV,
    [switch]$Json,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
AI Toolkit System Readiness Check

Usage: .\scripts\system-readiness-check.ps1 [options]

Options:
  -Help               Show this help message
  -CheckServer        Also check if the server is running and responding
  -Environment <env>  Set the environment (development, production, test)
  -Json               Output results in JSON format

Examples:
  .\scripts\system-readiness-check.ps1
  .\scripts\system-readiness-check.ps1 -CheckServer
  .\scripts\system-readiness-check.ps1 -Environment production
  .\scripts\system-readiness-check.ps1 -Json
"@
    exit 0
}

# Set environment if provided
if ($Environment) {
    $env:NODE_ENV = $Environment
}

# Colors for output
$Colors = @{
    Reset = "`e[0m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Cyan = "`e[36m"
    Bold = "`e[1m"
}

function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "Reset",
        [string]$Icon = ""
    )
    
    $colorCode = $Colors[$Color]
    Write-Host "$colorCode$Icon $Message$($Colors.Reset)"
}

function Write-Info { param([string]$Message) Write-ColoredOutput -Message $Message -Color "Blue" -Icon "ℹ️" }
function Write-Success { param([string]$Message) Write-ColoredOutput -Message $Message -Color "Green" -Icon "✅" }
function Write-Warning { param([string]$Message) Write-ColoredOutput -Message $Message -Color "Yellow" -Icon "⚠️" }
function Write-Error { param([string]$Message) Write-ColoredOutput -Message $Message -Color "Red" -Icon "❌" }

# Initialize results
$Results = @{
    passed = 0
    failed = 0
    warnings = 0
    checks = @()
}

$CurrentEnvironment = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }

function Invoke-Check {
    param(
        [string]$Name,
        [scriptblock]$CheckFunction
    )
    
    Write-Info "Checking $Name..."
    
    try {
        $result = & $CheckFunction
        
        switch ($result.status) {
            "pass" {
                $Results.passed++
                Write-Success "$Name`: PASSED - $($result.message)"
            }
            "warning" {
                $Results.warnings++
                Write-Warning "$Name`: WARNING - $($result.message)"
            }
            default {
                $Results.failed++
                Write-Error "$Name`: FAILED - $($result.message)"
            }
        }
        
        $Results.checks += @{
            name = $Name
            status = $result.status
            message = $result.message
            details = $result.details
        }
    }
    catch {
        $Results.failed++
        Write-Error "$Name`: ERROR - $($_.Exception.Message)"
        $Results.checks += @{
            name = $Name
            status = "fail"
            message = $_.Exception.Message
            details = $_.Exception.StackTrace
        }
    }
}

function Test-EnvironmentConfiguration {
    $requiredEnvVars = @("NODE_ENV", "PORT", "OLLAMA_HOST", "DATABASE_PATH", "REDIS_HOST")
    $missing = $requiredEnvVars | Where-Object { -not (Get-Item "env:$_" -ErrorAction SilentlyContinue) }
    
    if ($missing.Count -eq 0) {
        return @{ status = "pass"; message = "All required environment variables are set" }
    }
    elseif ($missing.Count -le 2) {
        return @{ 
            status = "warning"
            message = "Some environment variables missing: $($missing -join ', ')"
            details = "Using default values"
        }
    }
    else {
        return @{
            status = "fail"
            message = "Critical environment variables missing: $($missing -join ', ')"
            details = "System may not function correctly"
        }
    }
}

function Test-NodeVersion {
    $currentVersion = node --version
    $majorVersion = [int]($currentVersion -replace 'v(\d+)\..*', '$1')
    
    if ($majorVersion -ge 18) {
        return @{ status = "pass"; message = "Node.js version $currentVersion is supported" }
    }
    elseif ($majorVersion -ge 16) {
        return @{
            status = "warning"
            message = "Node.js version $currentVersion is deprecated"
            details = "Consider upgrading to Node.js 18+"
        }
    }
    else {
        return @{
            status = "fail"
            message = "Node.js version $currentVersion is not supported"
            details = "Minimum required version is Node.js 16"
        }
    }
}

function Test-Dependencies {
    try {
        $output = npm list --depth=0 2>&1
        if ($LASTEXITCODE -eq 0) {
            return @{ status = "pass"; message = "All dependencies are installed" }
        }
        else {
            $unmetCount = ($output | Select-String "UNMET DEPENDENCY").Count
            return @{
                status = "fail"
                message = "Missing dependencies detected"
                details = if ($unmetCount -gt 0) { "$unmetCount unmet dependencies" } else { "Run npm install" }
            }
        }
    }
    catch {
        return @{
            status = "fail"
            message = "Failed to check dependencies"
            details = $_.Exception.Message
        }
    }
}

function Test-OllamaConnection {
    try {
        $ollamaHost = if ($env:OLLAMA_HOST) { $env:OLLAMA_HOST } else { "localhost" }
        $ollamaPort = if ($env:OLLAMA_PORT) { $env:OLLAMA_PORT } else { "11434" }
        
        $response = Invoke-RestMethod -Uri "http://$ollamaHost`:$ollamaPort/api/tags" -TimeoutSec 10
        
        $modelCount = if ($response.models) { $response.models.Count } else { 0 }
        
        if ($modelCount -gt 0) {
            return @{ status = "pass"; message = "Ollama connected with $modelCount models available" }
        }
        else {
            return @{
                status = "warning"
                message = "Ollama connected but no models available"
                details = "Download models using: ollama pull <model-name>"
            }
        }
    }
    catch {
        return @{
            status = "fail"
            message = "Cannot connect to Ollama server"
            details = "Install and start Ollama: https://ollama.ai"
        }
    }
}

function Test-StoragePaths {
    $inputPath = if ($env:STORAGE_INPUT_PATH) { $env:STORAGE_INPUT_PATH } else { ".\data\input" }
    $outputPath = if ($env:STORAGE_OUTPUT_PATH) { $env:STORAGE_OUTPUT_PATH } else { ".\data\output" }
    $tempPath = if ($env:STORAGE_TEMP_PATH) { $env:STORAGE_TEMP_PATH } else { ".\temp" }
    
    $paths = @($inputPath, $outputPath, $tempPath)
    $missing = $paths | Where-Object { -not (Test-Path $_) }
    
    if ($missing.Count -eq 0) {
        return @{ status = "pass"; message = "All storage paths exist" }
    }
    elseif ($missing.Count -le 1) {
        return @{
            status = "warning"
            message = "Some storage paths missing"
            details = $missing -join ", "
        }
    }
    else {
        return @{
            status = "fail"
            message = "Multiple storage paths missing"
            details = $missing -join ", "
        }
    }
}

function Test-DatabaseFile {
    $dbPath = if ($env:DATABASE_PATH) { $env:DATABASE_PATH } else { ".\data\ai-toolkit.db" }
    
    if (Test-Path $dbPath) {
        return @{ status = "pass"; message = "Database file exists" }
    }
    else {
        return @{
            status = "warning"
            message = "Database file does not exist"
            details = "Will be created on first run"
        }
    }
}

function Test-PortAvailability {
    $port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        $listener.Stop()
        
        return @{ status = "pass"; message = "Port $port is available" }
    }
    catch {
        return @{
            status = "fail"
            message = "Port $port is already in use"
            details = "Choose a different port or stop the conflicting service"
        }
    }
}

function Test-BuildStatus {
    $distPath = "packages\api-server\dist"
    
    if (Test-Path $distPath) {
        return @{ status = "pass"; message = "Application is built" }
    }
    else {
        return @{
            status = "warning"
            message = "Application not built"
            details = "Run: npm run build"
        }
    }
}

function Test-HealthEndpoint {
    if (-not $CheckServer) {
        return @{ status = "pass"; message = "Skipped (use -CheckServer to enable)" }
    }
    
    try {
        $port = if ($env:PORT) { $env:PORT } else { "3000" }
        $response = Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 5
        
        return @{ status = "pass"; message = "Health endpoint responding ($($response.status))" }
    }
    catch {
        return @{
            status = "fail"
            message = "Health endpoint not accessible"
            details = "Start the server first"
        }
    }
}

# Main execution
Write-ColoredOutput -Message "🚀 AI Toolkit System Readiness Check" -Color "Cyan" -Icon ""
Write-ColoredOutput -Message "Environment: $CurrentEnvironment" -Color "Blue"
Write-ColoredOutput -Message "Timestamp: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -Color "Blue"
Write-Host ""

# Run all checks
Invoke-Check "Environment Configuration" { Test-EnvironmentConfiguration }
Invoke-Check "Node.js Version" { Test-NodeVersion }
Invoke-Check "Dependencies" { Test-Dependencies }
Invoke-Check "Build Status" { Test-BuildStatus }
Invoke-Check "Port Availability" { Test-PortAvailability }
Invoke-Check "Ollama Connection" { Test-OllamaConnection }
Invoke-Check "Storage Paths" { Test-StoragePaths }
Invoke-Check "Database File" { Test-DatabaseFile }
Invoke-Check "Health Endpoint" { Test-HealthEndpoint }

# Print summary
Write-Host ""
Write-ColoredOutput -Message "📊 Summary" -Color "Cyan" -Icon ""
Write-ColoredOutput -Message "✅ Passed: $($Results.passed)" -Color "Green"
Write-ColoredOutput -Message "⚠️  Warnings: $($Results.warnings)" -Color "Yellow"
Write-ColoredOutput -Message "❌ Failed: $($Results.failed)" -Color "Red"

$total = $Results.passed + $Results.warnings + $Results.failed
$successRate = if ($total -gt 0) { [math]::Round(($Results.passed / $total) * 100, 1) } else { 0 }

Write-Host ""
Write-ColoredOutput -Message "Success Rate: $successRate%" -Color "Bold"

if ($Results.failed -eq 0) {
    Write-Host ""
    Write-ColoredOutput -Message "🎉 System is ready for deployment!" -Color "Green" -Icon ""
}
else {
    Write-Host ""
    Write-ColoredOutput -Message "🚨 System is NOT ready for deployment" -Color "Red" -Icon ""
    Write-ColoredOutput -Message "Please fix the failed checks before proceeding." -Color "Red"
}

# Show recommendations
if ($Results.warnings -gt 0 -or $Results.failed -gt 0) {
    Write-Host ""
    Write-ColoredOutput -Message "📋 Recommendations:" -Color "Yellow" -Icon ""
    
    $Results.checks | Where-Object { $_.status -eq "fail" -or $_.status -eq "warning" } | ForEach-Object {
        Write-ColoredOutput -Message "• $($_.name): $($_.message)" -Color "Yellow"
        if ($_.details) {
            Write-ColoredOutput -Message "  → $($_.details)" -Color "Cyan"
        }
    }
}

if ($Json) {
    Write-Host ""
    $Results | ConvertTo-Json -Depth 10
}

exit $(if ($Results.failed -eq 0) { 0 } else { 1 })