#!/bin/bash

# Jira CLI Uninstaller for Linux/macOS
# This script removes the global symlink and cleans up

echo "========================================="
echo "Jira CLI Uninstaller"
echo "========================================="
echo ""

echo "This script will:"
echo "1. Remove the global 'jira-cli' symlink"
echo "2. Clean up local dependencies (optional)"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo "Removing global symlink..."
if command -v npm &> /dev/null; then
    if npm unlink -g jira-cli 2>/dev/null; then
        echo "✓ Global symlink removed"
    else
        echo "⚠ Could not remove global symlink (may not be installed)"
    fi
else
    echo "⚠ npm not found, skipping symlink removal"
fi

echo ""
read -p "Remove local node_modules and package-lock.json? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning local dependencies..."
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo "✓ Removed node_modules"
    fi
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
        echo "✓ Removed package-lock.json"
    fi
fi

echo ""
echo "========================================="
echo "Uninstallation complete!"
echo "========================================="
echo ""
echo "Note: The source code files are still in this directory."
echo "To completely remove Jira CLI, delete this folder."
echo ""