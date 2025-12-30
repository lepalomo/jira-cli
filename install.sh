#!/bin/bash

# Jira CLI Installer for Linux/macOS
# This script installs the Jira CLI tool globally

echo "========================================="
echo "Jira CLI Installer for Linux/macOS"
echo "========================================="
echo ""

# Check if Node.js is installed
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js LTS version from https://nodejs.org/ and try again."
    echo "After installing Node.js, restart your terminal and run this script again."
    exit 1
fi

node_version=$(node --version)
echo "✓ Node.js $node_version is installed"

# Check if npm is installed
echo "Checking for npm..."
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. It should come with Node.js."
    echo "Please reinstall Node.js or check your PATH environment variable."
    exit 1
fi

npm_version=$(npm --version)
echo "✓ npm v$npm_version is installed"

# Install dependencies
echo ""
echo "Installing dependencies..."
if ! npm install; then
    echo "Error: Failed to install dependencies. Check your internet connection."
    exit 1
fi
echo "✓ Dependencies installed successfully"

# Create global symlink
echo ""
echo "Creating global symlink..."
if ! npm link; then
    echo "Error: Failed to create global symlink. You may need to run with sudo."
    echo "Try running: sudo npm link"
    exit 1
fi
echo "✓ Global symlink created successfully"

echo ""
echo "========================================="
echo "Installation complete! 🎉"
echo "========================================="
echo ""
echo "You can now use the 'jira-cli' command in any terminal."
echo ""
echo "To get started, run:"
echo "  jira-cli --help"
echo ""
echo "For configuration, run:"
echo "  jira-cli config"
echo ""