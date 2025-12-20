#!/bin/bash

echo "Installing Jira CLI..."

# Install dependencies
npm install

# Create global symlink
npm link

echo "Installation complete. You can now use 'jira-cli' command."