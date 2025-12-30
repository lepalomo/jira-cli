# Clean Build Instructions - No Embedded Configuration

## 🎯 **Objective**
Create executable **without embedded API tokens, emails, or sensitive configuration**. Users must configure from scratch.

## 🔧 **Solution Implemented**

### 1. **Automatic Configuration Cleaning**
- Added `clean-config.js` script that removes `config.json` before building
- Added `prebuild` hook to automatically clean configuration
- Configuration files are excluded from pkg build via `ignore` pattern

### 2. **Updated Build Process**
```bash
# Clean build (recommended)
npm run clean-build

# This will:
# 1. Remove dist directory
# 2. Clean config.json (if exists)
# 3. Build clean executable
```

### 3. **Manual Cleaning Options**
```bash
# Just clean configuration
npm run clean:config

# Build without pre-clean
npm run build:win
```

## 🚀 **Step-by-Step Clean Build**

### **Step 1: Check current configuration**
```bash
node clean-config.js
```
This shows what sensitive data exists and creates a backup.

### **Step 2: Build clean executable**
```bash
npm run clean-build
```

### **Step 3: Verify no embedded configuration**
```bash
# Test the executable
./dist/jira-cli.exe --help

# Try to list projects (should fail without configuration)
./dist/jira-cli.exe list-projects
# Expected: "Missing configuration. Use 'set-config' to save credentials"
```

## 📋 **Configuration Management**

### **For Development:**
- Configuration is stored in `config.json`
- Use `set-config` command to save credentials
- File is in project root (excluded from Git via .gitignore)

### **For Distribution:**
- `config.json` is **NOT included** in executable
- Users must run `set-config` command
- Each user creates their own configuration file in their home directory

### **Configuration File Location:**
- **Development**: `./config.json` (project root)
- **Distribution**: User's home directory (platform-specific)
  - Windows: `%USERPROFILE%/.jira-cli/config.json`
  - Linux/macOS: `~/.jira-cli/config.json`

## 🛡️ **Security Features**

1. **No embedded credentials** in executable
2. **Configuration excluded** from pkg build
3. **Automatic cleanup** before building
4. **Backup created** before removal
5. **Clear error messages** when configuration missing

## 📁 **Files Updated**

### **`package.json` changes:**
- Added `clean:config` script
- Added `prebuild` hook for automatic cleaning
- Added `clean-build` script for one-command clean build
- Added `ignore` pattern in pkg config to exclude config files

### **New files:**
- `clean-config.js` - Configuration cleaning script
- `CLEAN-BUILD-INSTRUCTIONS.md` - This document

## 🔄 **Build Process Flow**

```
User runs: npm run clean-build
          ↓
1. Removes dist directory
          ↓
2. Runs clean-config.js
   - Checks for config.json
   - Creates backup if exists
   - Removes config.json
          ↓
3. Runs pkg build
   - Excludes config.json via ignore pattern
   - Creates clean executable
          ↓
4. Executable ready for distribution
```

## 🧪 **Testing Clean Build**

```bash
# 1. Clean build
npm run clean-build

# 2. Test executable
cd dist
./jira-cli.exe --version
./jira-cli.exe --help

# 3. Verify configuration is required
./jira-cli.exe list-projects
# Should show: "Missing configuration. Use 'set-config' to save credentials"

# 4. Test configuration setup
./jira-cli.exe set-config --url https://your-jira.atlassian.net --email user@example.com --token YOUR_TOKEN
```

## 📦 **Distribution Package**

### **What's included:**
- `jira-cli.exe` - Standalone executable
- `README.md` - Basic instructions
- No configuration files
- No embedded credentials

### **What users need to do:**
1. Download and extract the executable
2. Run `jira-cli.exe set-config` with their credentials
3. Use the CLI normally

## ⚠️ **Important Notes**

1. **Backup your configuration** before clean build
2. **Test the executable** on a clean system
3. **Document** that users need to configure from scratch
4. **Consider** adding a `--reset-config` option to the CLI

## ✅ **Success Criteria**

- [x] Executable built without embedded configuration
- [x] Automatic configuration cleaning
- [x] Backup of existing configuration
- [x] Clear user instructions
- [x] Security best practices followed

The solution ensures that distributed executables contain no sensitive data and require users to configure their own credentials.