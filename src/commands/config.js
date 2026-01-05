const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

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

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits for AES-256
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derive encryption key from passphrase using PBKDF2
 * @param {string} passphrase - The passphrase to derive key from
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(passphrase, salt) {
    return crypto.pbkdf2Sync(
        passphrase,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha256'
    );
}

/**
 * Get or create encryption key file path
 * @returns {string} Path to encryption key file
 */
function getKeyPath() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.jira-cli');
    
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    return path.join(configDir, '.encryption.key');
}

/**
 * Generate and save a new encryption key
 * @returns {Buffer} Generated encryption key
 */
function generateAndSaveKey() {
    const keyPath = getKeyPath();
    const key = crypto.randomBytes(KEY_LENGTH);
    
    // Save key to file with restricted permissions
    fs.writeFileSync(keyPath, key.toString('hex'));
    
    // Set file permissions to read/write for owner only (600)
    try {
        fs.chmodSync(keyPath, 0o600);
    } catch (error) {
        console.warn('Warning: Could not set file permissions on encryption key');
    }
    
    return key;
}

/**
 * Load encryption key from file, generate if doesn't exist
 * @returns {Buffer} Encryption key
 */
function loadEncryptionKey() {
    const keyPath = getKeyPath();
    
    if (fs.existsSync(keyPath)) {
        try {
            const keyHex = fs.readFileSync(keyPath, 'utf8').trim();
            return Buffer.from(keyHex, 'hex');
        } catch (error) {
            console.error('Error reading encryption key:', error.message);
            // Generate new key if existing one is corrupted
            return generateAndSaveKey();
        }
    }
    
    // Generate new key if it doesn't exist
    return generateAndSaveKey();
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @param {Buffer} key - Encryption key
 * @returns {string} Encrypted data as hex string (salt:iv:ciphertext:authTag)
 */
function encryptData(data, key) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = deriveKey(key.toString('hex'), salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine all components: salt:iv:ciphertext:authTag
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data as hex string
 * @param {Buffer} key - Encryption key
 * @returns {string} Decrypted data
 */
function decryptData(encryptedData, key) {
    const [saltHex, ivHex, ciphertext, authTagHex] = encryptedData.split(':');
    
    if (!saltHex || !ivHex || !ciphertext || !authTagHex) {
        throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const derivedKey = deriveKey(key.toString('hex'), salt);
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

function loadConfig() {
    if (fs.existsSync(configPath)) {
        try {
            const fileContent = fs.readFileSync(configPath, 'utf8').trim();
            
            // Check if file is encrypted (contains colons separating components)
            if (fileContent.includes(':') && fileContent.split(':').length === 4) {
                const key = loadEncryptionKey();
                const decrypted = decryptData(fileContent, key);
                return JSON.parse(decrypted);
            } else {
                // Legacy unencrypted format
                console.warn('Warning: Config file is not encrypted. Migrating to encrypted format...');
                const config = JSON.parse(fileContent);
                saveConfig(config); // This will save encrypted version
                return config;
            }
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
    
    // Normalize URL before saving if present
    const normalizedConfig = { ...config };
    if (normalizedConfig.url) {
        normalizedConfig.url = normalizeUrl(normalizedConfig.url);
    }
    
    // Encrypt the configuration
    const key = loadEncryptionKey();
    const jsonString = JSON.stringify(normalizedConfig, null, 2);
    const encryptedData = encryptData(jsonString, key);
    
    fs.writeFileSync(configPath, encryptedData);
    
    // Set file permissions to read/write for owner only (600)
    try {
        fs.chmodSync(configPath, 0o600);
    } catch (error) {
        console.warn('Warning: Could not set file permissions on config file');
    }
    
    console.log('Configuration saved to:', configPath);
    console.log('Note: Configuration is now encrypted for security.');
}

/**
 * Normalize URL by ensuring it has a protocol (https://)
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL with protocol
 */
function normalizeUrl(url) {
    if (!url) {
        return url;
    }
    
    // Trim any whitespace
    url = url.trim();
    
    // Check if URL already has a protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Default to https:// for Jira Cloud
    return `https://${url}`;
}

/**
 * Check if configuration is encrypted
 * @returns {boolean} True if config file exists and is encrypted
 */
function isConfigEncrypted() {
    if (!fs.existsSync(configPath)) {
        return false;
    }
    
    try {
        const fileContent = fs.readFileSync(configPath, 'utf8').trim();
        return fileContent.includes(':') && fileContent.split(':').length === 4;
    } catch (error) {
        return false;
    }
}

/**
 * Migrate existing unencrypted config to encrypted format
 */
function migrateToEncrypted() {
    if (fs.existsSync(configPath)) {
        try {
            const fileContent = fs.readFileSync(configPath, 'utf8').trim();
            
            // Only migrate if not already encrypted
            if (!fileContent.includes(':') || fileContent.split(':').length !== 4) {
                const config = JSON.parse(fileContent);
                saveConfig(config);
                console.log('Configuration migrated to encrypted format.');
            } else {
                console.log('Configuration is already encrypted.');
            }
        } catch (error) {
            console.error('Error migrating configuration:', error.message);
        }
    } else {
        console.log('No configuration file found to migrate.');
    }
}

module.exports = {
    loadConfig,
    saveConfig,
    getConfigPath,
    isConfigEncrypted,
    migrateToEncrypted
};