# Jira CLI Installer for Windows PowerShell
# This script installs the Jira CLI tool globally

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Jira CLI Installer for Windows" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running with appropriate execution policy
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
if ($currentPolicy -eq "Restricted" -or $currentPolicy -eq "AllSigned") {
    Write-Host "Warning: Your PowerShell execution policy is set to '$currentPolicy'." -ForegroundColor Yellow
    Write-Host "This may prevent scripts from running. If you encounter errors, try:" -ForegroundColor Yellow
    Write-Host "1. Run this script with: powershell -ExecutionPolicy Bypass -File install.ps1" -ForegroundColor Yellow
    Write-Host "2. Or run the install.bat file instead" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Green
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    Write-Host "Please install Node.js LTS version from https://nodejs.org/ and try again." -ForegroundColor Red
    Write-Host "After installing Node.js, restart your terminal and run this script again." -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green

# Check if npm is installed
Write-Host "Checking for npm..." -ForegroundColor Green
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed. It should come with Node.js." -ForegroundColor Red
    Write-Host "Please reinstall Node.js or check your PATH environment variable." -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version
Write-Host "✓ npm v$npmVersion is installed" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Green
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies. Check your internet connection." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Create global symlink
Write-Host ""
Write-Host "Creating global symlink..." -ForegroundColor Green
try {
    npm link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create global symlink. You may need to run as administrator." -ForegroundColor Red
        Write-Host "Try running: npm link (as administrator)" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Global symlink created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to create global symlink: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Installation complete! 🎉" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use the 'jira-cli' command in any terminal." -ForegroundColor Green
Write-Host ""
Write-Host "To get started, run:" -ForegroundColor Yellow
Write-Host "  jira-cli --help" -ForegroundColor White
Write-Host ""
Write-Host "For configuration, run:" -ForegroundColor Yellow
Write-Host "  jira-cli config" -ForegroundColor White
Write-Host ""