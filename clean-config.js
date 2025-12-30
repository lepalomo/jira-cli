#!/usr/bin/env node

/**
 * Clean configuration script
 * Removes sensitive configuration data before building executable
 */

const fs = require('fs');
const path = require('path');

console.log('=== Cleaning Configuration for Distribution ===\n');

const configPath = path.join(__dirname, 'config.json');
const backupPath = path.join(__dirname, 'config.json.backup');

// Check if config exists
if (fs.existsSync(configPath)) {
    console.log('Found config.json file.');
    
    // Read the config to show what's being removed
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('Current configuration contains:');
        
        const sensitiveKeys = ['url', 'email', 'token', 'logEmail', 'smtpUser', 'smtpPass'];
        let hasSensitiveData = false;
        
        for (const key of sensitiveKeys) {
            if (config[key]) {
                console.log(`  - ${key}: ${key.includes('Pass') ? '***HIDDEN***' : config[key]}`);
                hasSensitiveData = true;
            }
        }
        
        if (!hasSensitiveData) {
            console.log('  No sensitive data found.');
        }
        
        // Create backup
        fs.copyFileSync(configPath, backupPath);
        console.log(`\nBackup created: ${backupPath}`);
        
        // Remove the config file
        fs.unlinkSync(configPath);
        console.log('config.json removed for clean build.');
        
        console.log('\n✅ Configuration cleaned successfully.');
        console.log('The executable will be built without embedded credentials.');
        console.log('Users will need to configure from scratch using:');
        console.log('  jira-cli.exe set-config --url <url> --email <email> --token <token>');
        
    } catch (error) {
        console.error('Error reading config:', error.message);
    }
} else {
    console.log('No config.json found. Ready for clean build.');
}

console.log('\n=== Build Instructions ===');
console.log('Run: npm run clean-build');
console.log('This will:');
console.log('1. Remove any existing config.json');
console.log('2. Clean the dist directory');
console.log('3. Build a clean executable without embedded credentials');