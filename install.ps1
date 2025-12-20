# Jira CLI Installer for Windows PowerShell

Write-Host "Installing Jira CLI..."

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install Node.js from https://nodejs.org/ and try again."
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed. It should come with Node.js."
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Create global symlink
Write-Host "Creating global symlink..."
npm link

Write-Host "Installation complete. You can now use 'jira-cli' command in any terminal."