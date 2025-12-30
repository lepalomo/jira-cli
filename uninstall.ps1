# Jira CLI Uninstaller for Windows PowerShell
# This script removes the global symlink and cleans up

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Jira CLI Uninstaller" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Remove the global 'jira-cli' symlink" -ForegroundColor Yellow
Write-Host "2. Clean up local dependencies (optional)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "Uninstallation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Removing global symlink..." -ForegroundColor Green
try {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm unlink -g jira-cli 2>$null
        Write-Host "✓ Global symlink removed" -ForegroundColor Green
    } else {
        Write-Host "⚠ npm not found, skipping symlink removal" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not remove global symlink (may not be installed)" -ForegroundColor Yellow
}

Write-Host ""
$cleanDeps = Read-Host "Remove local node_modules and package-lock.json? (y/N)"
if ($cleanDeps -match '^[Yy]$') {
    Write-Host "Cleaning local dependencies..." -ForegroundColor Green
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Write-Host "✓ Removed node_modules" -ForegroundColor Green
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        Write-Host "✓ Removed package-lock.json" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Uninstallation complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: The source code files are still in this directory." -ForegroundColor Yellow
Write-Host "To completely remove Jira CLI, delete this folder." -ForegroundColor Yellow
Write-Host ""