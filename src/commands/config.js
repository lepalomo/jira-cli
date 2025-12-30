const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../config.json');

function loadConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {};
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved.');
}

module.exports = { loadConfig, saveConfig };