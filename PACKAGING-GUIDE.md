# Packaging Jira CLI as EXE and MSI

This guide explains how to package the Node.js Jira CLI application as standalone executables (EXE) and Windows Installer packages (MSI).

## Overview

The Jira CLI is a Node.js command-line application that can be packaged for distribution to users who don't have Node.js installed. There are several approaches:

1. **Standalone EXE**: Single executable file with Node.js runtime embedded
2. **MSI Installer**: Windows installer package for professional distribution
3. **Portable ZIP**: Simple zip file with executable and dependencies

## Recommended Approach

For this Jira CLI project, the recommended approach is:

1. Use **pkg** to create standalone EXE files
2. Use **Inno Setup** or **WiX Toolset** to create MSI installers
3. Provide both EXE and MSI for different user needs

## Step-by-Step Implementation

### 1. Install Required Tools

```bash
# Install pkg globally or as dev dependency
npm install -g pkg
# OR add to package.json devDependencies
npm install --save-dev pkg
```

### 2. Update package.json

Add packaging scripts to your `package.json`:

```json
"scripts": {
  "build:win": "pkg . --targets node18-win-x64 --output dist/jira-cli.exe",
  "build:linux": "pkg . --targets node18-linux-x64 --output dist/jira-cli",
  "build:mac": "pkg . --targets node18-macos-x64 --output dist/jira-cli",
  "build:all": "pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --output dist/jira-cli-"
}
```

### 3. Create Standalone EXE

```bash
# Build Windows executable
npm run build:win

# The executable will be created at: dist/jira-cli.exe
# Users can run: jira-cli.exe --help
```

### 4. Test the Executable

```bash
cd dist
./jira-cli.exe --help
./jira-cli.exe list-projects --url https://your-jira.atlassian.net --email user@example.com --token YOUR_TOKEN
```

## Creating MSI Installers

### Option A: Using Inno Setup (Recommended for simplicity)

1. Download and install Inno Setup from: https://jrsoftware.org/isinfo.php
2. Create an ISS script file (`jira-cli.iss`):

```iss
[Setup]
AppName=Jira CLI
AppVersion=1.0.0
DefaultDirName={pf}\JiraCLI
DefaultGroupName=Jira CLI
UninstallDisplayIcon={app}\jira-cli.exe
OutputDir=dist
OutputBaseFilename=jira-cli-setup
Compression=lzma
SolidCompression=yes

[Files]
Source: "dist\jira-cli.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Jira CLI"; Filename: "{app}\jira-cli.exe"
Name: "{group}\Uninstall Jira CLI"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\jira-cli.exe"; Description: "Launch Jira CLI"; Flags: postinstall nowait skipifsilent
```

3. Compile the installer using Inno Setup Compiler

### Option B: Using WiX Toolset (Professional MSI)

1. Install WiX Toolset from: https://wixtoolset.org/
2. Use the provided `create-msi.js` script as a starting point
3. Customize the `jira-cli.wxs` file for your needs
4. Compile with:
   ```bash
   candle.exe jira-cli.wxs
   light.exe jira-cli.wixobj -out jira-cli.msi
   ```

## Advanced Packaging Options

### Using electron-builder (for GUI wrappers)

If you want to add a GUI interface later:

```bash
npm install --save-dev electron electron-builder
```

Create `electron-main.js` and use electron-builder to create installers for all platforms.

### Using nexe (alternative to pkg)

```bash
npm install -g nexe
nexe index.js -o dist/jira-cli.exe -t windows-x64-18.0.0
```

## Distribution Considerations

### File Size
- Standalone EXE: ~40-80MB (includes Node.js runtime)
- MSI Installer: Similar size plus installer overhead

### Dependencies
The packaged executable includes:
- Node.js runtime
- All npm dependencies (axios, commander, cli-table3, nodemailer)
- Your application code

### Configuration Files
Users will need to configure Jira credentials:
- Via command line options each time
- Or using `set-config` command which creates config files in user's home directory

## Troubleshooting

### Common Issues

1. **Missing assets**: If your app reads files at runtime, specify them in pkg config:
   ```json
   "pkg": {
     "assets": ["config/*.json", "templates/*"]
   }
   ```

2. **Native modules**: If using native Node.js modules, ensure they're included in the build.

3. **File paths**: Use `path.join(__dirname, 'file')` instead of relative paths.

4. **Dynamic requires**: pkg may not detect dynamic `require()` calls. Use static imports or list files explicitly.

## Automated Build Pipeline

Create a `build.js` script for automated packaging:

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building Jira CLI packages...');

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Build executables
console.log('Building Windows executable...');
execSync('pkg . --targets node18-win-x64 --output dist/jira-cli.exe', { stdio: 'inherit' });

console.log('Building Linux executable...');
execSync('pkg . --targets node18-linux-x64 --output dist/jira-cli-linux', { stdio: 'inherit' });

console.log('Building macOS executable...');
execSync('pkg . --targets node18-macos-x64 --output dist/jira-cli-macos', { stdio: 'inherit' });

console.log('Creating zip archives...');
// Add zip creation logic here

console.log('Build complete!');
```

## Next Steps

1. Test the packaged executable on a clean Windows machine without Node.js
2. Consider code signing for Windows executables
3. Set up CI/CD pipeline for automated builds
4. Create documentation for end users
5. Consider adding auto-update functionality

## Resources

- [pkg documentation](https://github.com/vercel/pkg)
- [Inno Setup documentation](https://jrsoftware.org/ishelp.php)
- [WiX Toolset documentation](https://wixtoolset.org/documentation/)
- [electron-builder documentation](https://www.electron.build/)
