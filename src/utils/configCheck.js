/**
 * Configuration validation utility
 * Provides friendly messages when configuration is missing
 */

/**
 * Check if configuration is complete and provide friendly error message if not
 * @param {Object} config - Configuration object
 * @returns {boolean} - True if config is valid, false otherwise
 */
function validateConfig(config) {
    if (!config.url || !config.email || !config.token) {
        showConfigurationMessage();
        return false;
    }
    return true;
}

/**
 * Display friendly configuration setup message
 */
function showConfigurationMessage() {
    console.log('\n🔧 Configuration Required');
    console.log('═'.repeat(50));
    console.log('');
    console.log('It looks like you haven\'t set up your Jira credentials yet!');
    console.log('');
    console.log('📋 You have two options:');
    console.log('');
    console.log('1️⃣  Set up permanent configuration (recommended):');
    console.log('   jira-cli set-config \\');
    console.log('     -u https://yourcompany.atlassian.net \\');
    console.log('     -e your-email@example.com \\');
    console.log('     -t your-api-token');
    console.log('');
    console.log('2️⃣  Use temporary credentials for this command:');
    console.log('   Add these options to your current command:');
    console.log('   -u https://yourcompany.atlassian.net \\');
    console.log('   -e your-email@example.com \\');
    console.log('   -t your-api-token');
    console.log('');
    console.log('💡 Need help getting your API token?');
    console.log('   Visit: https://id.atlassian.com/manage-profile/security/api-tokens');
    console.log('');
    console.log('═'.repeat(50));
}

module.exports = {
    validateConfig,
    showConfigurationMessage
};