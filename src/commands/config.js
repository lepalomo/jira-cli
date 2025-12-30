const fs = require('fs');
const path = require('path');
const os = require('os');

// Use platform-specific config directory
function getConfigPath() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.jira-cli');
    
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    return path.join(configDir, 'config.json');
}

const configPath = getConfigPath();

function loadConfig() {
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('Error reading config file:', error.message);
            return {};
        }
    }
    return {};
}

function saveConfig(config) {
    const configDir = path.dirname(configPath);
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved to:', configPath);
}

module.exports = { loadConfig, saveConfig, getConfigPath };