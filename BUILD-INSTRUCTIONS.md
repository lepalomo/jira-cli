# Building Jira CLI as EXE/MSI - Quick Start

## Prerequisites

1. **Node.js** installed (v14 or higher)
2. **npm** package manager

## Step 1: Install Dependencies

```bash
# Install pkg globally (if not already installed)
npm install -g pkg

# OR install as dev dependency locally
npm install --save-dev pkg
```

## Step 2: Build the Executable

```bash
# Build Windows executable
npm run build:win

# This will create: dist/jira-cli.exe
```

## Step 3: Test the Executable

```bash
# Run the built executable
./dist/jira-cli.exe --help

# Test with a simple command
./dist/jira-cli.exe --version
```

## Step 4: Package for Distribution

```bash
# Create a zip package
npm run package

# This creates: dist/jira-cli-windows.zip
```

## Troubleshooting Common Issues

### Issue: "Cannot find module" error
This happens when pkg doesn't include all required modules. The updated `package.json` now includes all dependencies in the `pkg.assets` section.

### Solution: Rebuild with proper configuration
1. Delete the `dist` folder if it exists
2. Run `npm run build:win` again
3. Test with `npm run test:build`

### Alternative Build Command
If you still have issues, try this explicit command:

```bash
pkg index.js --targets node18-win-x64 --output dist/jira-cli.exe --config package.json
```

## Creating MSI Installer

### Option 1: Using Inno Setup (Recommended)
1. Download Inno Setup from https://jrsoftware.org/isinfo.php
2. Use the provided `jira-cli.iss` script template
3. Compile with Inno Setup Compiler

### Option 2: Using WiX Toolset
1. Install WiX Toolset from https://wixtoolset.org/
2. Run the provided `create-msi.js` script
3. Follow the instructions in the script

## Quick Test Script

Create a test script to verify the build:

```bash
#!/bin/bash
echo "Building Jira CLI..."
npm run build:win

if [ -f "./dist/jira-cli.exe" ]; then
    echo "Build successful! Testing executable..."
    ./dist/jira-cli.exe --help
    echo "Executable size: $(du -h ./dist/jira-cli.exe | cut -f1)"
else
    echo "Build failed!"
    exit 1
fi
```

## Distribution Checklist

- [ ] Test executable on a clean Windows machine without Node.js
- [ ] Verify all commands work correctly
- [ ] Check file size (should be ~40-80MB)
- [ ] Consider code signing for Windows
- [ ] Create installer (MSI or Inno Setup)
- [ ] Document installation instructions
- [ ] Provide example usage

## Support

If you encounter issues:
1. Check the pkg documentation: https://github.com/vercel/pkg
2. Ensure all dependencies are listed in `package.json`
3. Try building with `--debug` flag: `pkg . --debug`
4. Check for native module compatibility issues