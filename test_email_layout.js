console.log('=== Email Layout and Outlook Compatibility Analysis ===\n');

// Analyze current email formatting from emailLogger.js
console.log('1. Current HTML Formatting (from emailLogger.js line 28):');
console.log('   html: `<pre>${content}</pre>`');
console.log('   text: content (plain text)');
console.log('');

// Test various content scenarios
console.log('2. Content Scenarios Analysis:\n');

const testCases = [
    {
        name: 'Simple success message',
        content: 'Limpeza completa executada com sucesso.',
        issues: []
    },
    {
        name: 'Multi-line results',
        content: `Resultados da limpeza (3 workflows):
✓ Workflow 101 excluído com sucesso.
✓ Workflow 102 excluído com sucesso.
✗ Erro ao excluir workflow 103: Workflow em uso`,
        issues: ['Special characters (✓, ✗) may not render consistently']
    },
    {
        name: 'Content with HTML special characters',
        content: `Test <script>alert("xss")</script> & "quotes" 'apostrophes'`,
        issues: ['HTML injection risk - characters not escaped', 'Potential XSS vulnerability']
    },
    {
        name: 'Content with emoji and symbols',
        content: `✅ Success! ⚠ Warning! ❌ Error! 🚀 Rocket`,
        issues: ['Emoji may not render in all email clients', 'Outlook may show blank squares']
    },
    {
        name: 'Long lines in <pre> tag',
        content: 'A'.repeat(200) + ' ' + 'B'.repeat(200),
        issues: ['<pre> tag may cause horizontal scrolling in email clients', 'Outlook may break layout']
    },
    {
        name: 'Table-like output (from cli-table3)',
        content: `┌──────────┬────────────────────────────┐
│ ID       │ Name                       │
├──────────┼────────────────────────────┤
│ 101      │ Workflow A                 │
│ 102      │ Workflow B                 │
└──────────┴────────────────────────────┘`,
        issues: ['Box-drawing characters may not render properly', 'Monospace font required for alignment']
    }
];

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('Content preview:', testCase.content.substring(0, 80) + (testCase.content.length > 80 ? '...' : ''));
    console.log('HTML generated:', `<pre>${testCase.content.substring(0, 50)}...</pre>`);
    if (testCase.issues.length > 0) {
        console.log('Issues:');
        testCase.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('');
});

// Outlook-specific compatibility analysis
console.log('3. Outlook Compatibility Issues:\n');

const outlookIssues = [
    {
        issue: '<pre> tag styling',
        description: 'Outlook may apply default styles to <pre> tags or ignore them',
        impact: 'Medium',
        recommendation: 'Add inline CSS: <pre style="font-family: monospace; white-space: pre; margin: 1em 0;">'
    },
    {
        issue: 'HTML escaping',
        description: 'Content is not HTML-escaped, allowing potential XSS and rendering issues',
        impact: 'High',
        recommendation: 'Use htmlEscape(content) before wrapping in <pre> tags'
    },
    {
        issue: 'Character encoding',
        description: 'Special characters (✓, ✗, emoji) may not display correctly',
        impact: 'Medium',
        recommendation: 'Use HTML entities or remove special characters'
    },
    {
        issue: 'Line length',
        description: 'Long lines in <pre> tags cause horizontal scrolling',
        impact: 'Low',
        recommendation: 'Add word-wrap: break-word CSS or pre-process content'
    },
    {
        issue: 'Monospace font availability',
        description: 'Not all email clients have good monospace font support',
        impact: 'Low',
        recommendation: 'Specify fallback fonts: "Courier New", Courier, monospace'
    },
    {
        issue: 'Email client variability',
        description: 'Different email clients (Outlook, Gmail, Apple Mail) render HTML differently',
        impact: 'High',
        recommendation: 'Test across multiple clients or use simpler formatting'
    }
];

outlookIssues.forEach(issue => {
    console.log(`• ${issue.issue}:`);
    console.log(`  Description: ${issue.description}`);
    console.log(`  Impact: ${issue.impact}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
    console.log('');
});

// Test HTML escaping function
console.log('4. HTML Escaping Test:\n');

function htmlEscape(text) {
    return text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

const dangerousContent = 'Test <script>alert("xss")</script> & "quotes"';
console.log('Original:', dangerousContent);
console.log('Escaped:', htmlEscape(dangerousContent));
console.log('');

// Improved HTML template
console.log('5. Improved HTML Template Proposal:\n');

const improvedTemplate = (content) => {
    const escapedContent = htmlEscape(content);
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jira CLI Log</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0052cc; border-bottom: 2px solid #0052cc; padding-bottom: 10px;">
            Jira CLI Operation Log
        </h2>
        <div style="background-color: #f5f5f5; border-left: 4px solid #0052cc; padding: 15px; margin: 20px 0;">
            <pre style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px;">
${escapedContent}
            </pre>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was automatically generated by Jira CLI.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`.trim();
};

console.log('Improved template would provide:');
console.log('  - Proper HTML structure with DOCTYPE');
console.log('  - Responsive design with max-width');
console.log('  - Better styling for readability');
console.log('  - HTML escaping for security');
console.log('  - Timestamp for tracking');
console.log('  - Better Outlook compatibility');

// Subject line analysis
console.log('\n6. Subject Line Analysis:\n');
console.log('Current format: "Jira CLI - ${subject}"');
console.log('Examples:');
console.log('  - "Jira CLI - Cleanup Workflows - Executado"');
console.log('  - "Jira CLI - Cleanup Complete - Erro"');
console.log('Issues:');
console.log('  - "Jira CLI - " prefix adds 10 characters');
console.log('  - Mixed language (Portuguese/English)');
console.log('  - No timestamp in subject');
console.log('Recommendations:');
console.log('  - Consider shorter prefix or put it at end');
console.log('  - Include date: "[Jira CLI] YYYY-MM-DD: ${subject}"');
console.log('  - Keep under 60 characters when possible');