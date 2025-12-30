@echo off
REM Jira CLI Installer Batch Wrapper for Windows
REM This batch file helps users bypass PowerShell execution policy restrictions

echo =========================================
echo Jira CLI Installer for Windows
echo =========================================
echo.

echo This batch file will run the PowerShell installer with appropriate permissions.
echo If you encounter any issues, please try running as Administrator.
echo.

set /p continue="Do you want to continue? (Y/N): "
if /i "%continue%" neq "Y" (
    echo Installation cancelled.
    pause
    exit /b 1
)

echo.
echo Checking PowerShell availability...
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: PowerShell is not installed or not in PATH.
    echo Please install PowerShell 5.1 or later.
    pause
    exit /b 1
)

echo.
echo Running PowerShell installer with bypass execution policy...
echo.

REM Run PowerShell with bypass execution policy
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo =========================================
    echo Installation failed with error code %errorlevel%
    echo =========================================
    echo.
    echo Troubleshooting steps:
    echo 1. Make sure Node.js is installed (https://nodejs.org/)
    echo 2. Run this batch file as Administrator
    echo 3. Try manual installation:
    echo    - Open PowerShell as Administrator
    echo    - Run: cd "%~dp0"
    echo    - Run: npm install
    echo    - Run: npm link
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo =========================================
echo Installation completed successfully!
echo =========================================
echo.
pause