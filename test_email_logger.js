const { loadConfig } = require('./src/commands/config');
const EmailLogger = require('./src/utils/emailLogger');

console.log('Testing Email Logger Configuration...\n');

// Load current config
const config = loadConfig();
console.log('Current config keys:', Object.keys(config));
console.log('Has logEmail?', !!config.logEmail);
console.log('Has smtpUser?', !!config.smtpUser);
console.log('Has smtpPass?', !!config.smtpPass);

// Test EmailLogger instantiation
console.log('\nTesting EmailLogger instantiation:');
try {
    const emailLogger = new EmailLogger(config);
    console.log('EmailLogger created successfully');
    console.log('logEmail property:', emailLogger.logEmail);
    console.log('transporter exists?', !!emailLogger.transporter);
    
    // Test sendLog method
    console.log('\nTesting sendLog method (will not actually send if no transporter):');
    if (emailLogger.transporter) {
        console.log('Transporter exists, attempting to send test email...');
        // We'll add a mock to prevent actual sending
        console.log('(Actual sending disabled for test)');
    } else {
        console.log('No transporter - email sending would be skipped');
    }
} catch (error) {
    console.error('Error creating EmailLogger:', error.message);
}

// Test HTML formatting
console.log('\n\nTesting HTML formatting for Outlook compatibility:');
const testContent = `Test Results:
- Item 1: Success ✓
- Item 2: Failed ✗
- Item 3: Pending ⏳

Details:
This is a multi-line test content with special characters: < > & " '
And some emoji: 😊 ✅ ❌`;

console.log('Test content:');
console.log(testContent);
console.log('\nHTML that would be generated:');
console.log(`<pre>${testContent}</pre>`);

// Check for Outlook compatibility issues
console.log('\n\nOutlook compatibility analysis:');
console.log('1. <pre> tags: Outlook supports <pre> but may have font/styling issues');
console.log('2. Special characters: < > & " \' need HTML escaping');
console.log('3. Emoji: May not render consistently across email clients');
console.log('4. Line breaks: <pre> preserves formatting but may have width issues');

// Test subject line
console.log('\n\nSubject line formatting:');
const testSubject = 'Cleanup Workflows - Executado';
const fullSubject = `Jira CLI - ${testSubject}`;
console.log('Original subject:', testSubject);
console.log('Full subject:', fullSubject);
console.log('Length:', fullSubject.length, 'characters');
console.log('Note: Email subjects typically truncated at 60-80 characters');