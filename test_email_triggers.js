console.log('=== Email Trigger Analysis ===\n');

// Analyze cleanupWorkflows function (lines 340-441)
console.log('1. cleanupWorkflows() email triggers:');
console.log('   - EmailLogger instantiated only when execute=true (line 345-347)');
console.log('   - Email sent in execution mode (line 400): await emailLogger.sendLog(\'Cleanup Workflows - Executado\', logContent)');
console.log('   - Email sent on cancellation (line 381): await emailLogger.sendLog(\'Cleanup Workflows - Cancelado\', message)');
console.log('   - Email sent on error (line 437): await emailLogger.sendLog(\'Cleanup Workflows - Erro\', `Erro: ${error.message}`)');
console.log('   - NO email sent in preview mode (lines 425-432: "Email sending removed for preview mode")');
console.log('');

// Analyze cleanupWorkflowSchemes function (lines 443-547)
console.log('2. cleanupWorkflowSchemes() email triggers:');
console.log('   - Same pattern as cleanupWorkflows');
console.log('   - EmailLogger instantiated only when execute=true (line 448-450)');
console.log('   - Email sent in execution mode (line 503)');
console.log('   - Email sent on cancellation (line 484)');
console.log('   - Email sent on error (line 543)');
console.log('   - NO email sent in preview mode');
console.log('');

// Analyze cleanupComplete function (lines 959-1269)
console.log('3. cleanupComplete() email triggers:');
console.log('   - EmailLogger instantiated only when execute=true (line 964-966)');
console.log('   - Email sent at end if execute=true (line 1260): await emailLogger.sendLog(\'Cleanup Complete - Executado\', \'Limpeza completa executada com sucesso.\')');
console.log('   - Email sent on error (line 1265): await emailLogger.sendLog(\'Cleanup Complete - Erro\', `Erro: ${error.message}`)');
console.log('   - NO email sent for individual sections or in preview mode');
console.log('');

// Analyze deleteWorkflows with --unused --exec (lines 137-219)
console.log('4. deleteWorkflows() with --unused --exec:');
console.log('   - NO EmailLogger instantiation in this function');
console.log('   - NO email sending at all');
console.log('   - Inconsistent with cleanup commands!');
console.log('');

// Analyze deleteWorkflowSchemes with --unused --exec (lines 221-307)
console.log('5. deleteWorkflowSchemes() with --unused --exec:');
console.log('   - NO EmailLogger instantiation in this function');
console.log('   - NO email sending at all');
console.log('   - Inconsistent with cleanup commands!');
console.log('');

// Check other commands
console.log('6. Other commands analysis:');
console.log('   - archive-projects: NO email sending');
console.log('   - delete-projects: NO email sending');
console.log('   - Specific ID deletions (without --unused): NO email sending');
console.log('');

// Test the actual conditions
console.log('=== Testing Conditions ===\n');

// Mock config with email settings
const mockConfigWithEmail = {
    logEmail: 'test@example.com',
    smtpUser: 'user@gmail.com',
    smtpPass: 'password',
    url: 'https://test.atlassian.net',
    email: 'user@test.com',
    token: 'token123'
};

const mockConfigWithoutEmail = {
    url: 'https://test.atlassian.net',
    email: 'user@test.com',
    token: 'token123'
};

console.log('Condition 1: EmailLogger with full config');
const EmailLogger = require('./src/utils/emailLogger');
const loggerWithConfig = new EmailLogger(mockConfigWithEmail);
console.log(`   - logEmail: ${loggerWithConfig.logEmail}`);
console.log(`   - transporter exists: ${!!loggerWithConfig.transporter}`);
console.log(`   - Would send emails: ${!!(loggerWithConfig.logEmail && loggerWithConfig.transporter)}`);

console.log('\nCondition 2: EmailLogger without email config');
const loggerWithoutConfig = new EmailLogger(mockConfigWithoutEmail);
console.log(`   - logEmail: ${loggerWithoutConfig.logEmail}`);
console.log(`   - transporter exists: ${!!loggerWithoutConfig.transporter}`);
console.log(`   - Would send emails: ${!!(loggerWithoutConfig.logEmail && loggerWithoutConfig.transporter)}`);

console.log('\n=== Summary of Issues ===');
console.log('1. Missing email configuration in current setup');
console.log('2. Inconsistent email sending between cleanup commands and delete commands');
console.log('3. Silent error handling in EmailLogger.sendLog()');
console.log('4. HTML formatting uses <pre> tags without proper escaping');
console.log('5. Gmail SMTP hardcoded - may not work with other providers');
console.log('6. No email sending for preview modes (expected behavior)');
console.log('7. Subject line includes "Jira CLI - " prefix');