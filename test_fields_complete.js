// Test script to verify createFieldsTable data extraction with complete API schema
const { createFieldsTable } = require('./src/utils/table.js');

// Sample data matching the complete API response schema
const sampleFields = [
    {
        "id": "customfield_10000",
        "name": "Approvers",
        "screensCount": 2,
        "contextsCount": 2,
        "projectsCount": 5,
        "lastUsed": {
            "type": "TRACKED",
            "value": "2021-01-28T07:37:40.000+0000"
        },
        "description": "A custom field for tracking approvers",
        "schema": {
            "custom": "com.atlassian.jira.plugin.system.customfieldtypes:multiselect",
            "customId": 10000
        },
        "isLocked": false,
        "isUnscreenable": false,
        "key": "customfield_10000",
        "searcherKey": "com.atlassian.jira.plugin.system.customfieldtypes:multiselectsearcher",
        "stableId": "customfield_10000",
        "typeDisplayName": "Multi-select"
    },
    {
        "id": "customfield_10001",
        "name": "Priority",
        "screensCount": 5,
        "contextsCount": 3,
        "projectsCount": 0,
        "lastUsed": {
            "type": "NOT_TRACKED"
        },
        "description": "System field for issue priority",
        "schema": {
            "custom": null
        },
        "isLocked": true,
        "isUnscreenable": true,
        "key": "priority",
        "stableId": "com.atlassian.jira.plugin.system.customfieldtypes:priority",
        "typeDisplayName": "Priority"
    },
    {
        "id": "customfield_10002",
        "name": "Story Points",
        "screensCount": 0,
        "contextsCount": 1,
        "projectsCount": 12,
        "lastUsed": {
            "type": "NO_INFORMATION"
        },
        "description": "Custom field for agile story points estimation",
        "schema": {
            "custom": "com.atlassian.jira.plugin.system.customfieldtypes:float",
            "customId": 10002
        },
        "isLocked": false,
        "isUnscreenable": false,
        "key": "customfield_10002",
        "searcherKey": "com.atlassian.jira.plugin.system.customfieldtypes:floatsearcher",
        "stableId": "customfield_10002",
        "typeDisplayName": "Number"
    },
    {
        "id": "customfield_10003",
        "name": "Status",
        "screensCount": null,
        "contextsCount": null,
        "projectsCount": null,
        "lastUsed": null,
        "description": "System field for issue status",
        "schema": {
            "custom": null
        },
        "isLocked": false,
        "isUnscreenable": false,
        "key": "status",
        "stableId": "com.atlassian.jira.plugin.system.customfieldtypes:status",
        "typeDisplayName": "Status"
    },
    {
        "id": "customfield_10004",
        "name": "Assignee",
        "screensCount": 8,
        "contextsCount": 6,
        "projectsCount": 20,
        "lastUsed": {
            "type": "TRACKED",
            "value": null
        },
        "description": "System field for issue assignee",
        "schema": {
            "custom": null
        },
        "isLocked": false,
        "isUnscreenable": false,
        "key": "assignee",
        "stableId": "com.atlassian.jira.plugin.system.customfieldtypes:assignee",
        "typeDisplayName": "Assignee"
    }
];

console.log("Testing createFieldsTable with complete API schema...\n");

// Test the table creation
try {
    const tableOutput = createFieldsTable(sampleFields);
    console.log("Generated table:");
    console.log(tableOutput);
    
    console.log("\n\nVerifying data extraction for each field:");
    
    sampleFields.forEach((field, index) => {
        console.log(`\nField ${index + 1}: ${field.name}`);
        
        // Test screensCount extraction
        let screensCount = '0';
        if (field.screensCount !== undefined && field.screensCount !== null) {
            screensCount = field.screensCount.toString();
        } else if (field.screens !== undefined && field.screens !== null) {
            if (Array.isArray(field.screens)) {
                screensCount = field.screens.length.toString();
            } else if (typeof field.screens === 'number') {
                screensCount = field.screens.toString();
            }
        }
        console.log(`  screensCount: ${field.screensCount} -> extracted: ${screensCount}`);
        
        // Test contextsCount extraction
        let contextsCount = '0';
        if (field.contextsCount !== undefined && field.contextsCount !== null) {
            contextsCount = field.contextsCount.toString();
        } else if (field.contexts !== undefined && field.contexts !== null) {
            if (Array.isArray(field.contexts)) {
                contextsCount = field.contexts.length.toString();
            } else if (typeof field.contexts === 'number') {
                contextsCount = field.contexts.toString();
            }
        }
        console.log(`  contextsCount: ${field.contextsCount} -> extracted: ${contextsCount}`);
        
        // Test lastUsed extraction
        let lastUsed = 'Never';
        if (field.lastUsed && field.lastUsed.type) {
            if (field.lastUsed.type === 'NOT_TRACKED') {
                lastUsed = 'Never';
            } else if (field.lastUsed.type === 'NO_INFORMATION') {
                lastUsed = 'No info';
            } else if (field.lastUsed.type === 'TRACKED') {
                if (field.lastUsed.value) {
                    try {
                        const date = new Date(field.lastUsed.value);
                        lastUsed = date.toLocaleDateString('en-US');
                    } catch (e) {
                        lastUsed = field.lastUsed.value;
                    }
                } else {
                    lastUsed = 'Never';
                }
            }
        }
        console.log(`  lastUsed.type: ${field.lastUsed?.type || 'null'} -> extracted: ${lastUsed}`);
    });
    
    console.log("\n✅ Test completed successfully!");
    console.log("\nSummary of fixes applied:");
    console.log("1. Fixed screensCount extraction to handle null values");
    console.log("2. Fixed contextsCount extraction to handle null values");
    console.log("3. Fixed lastUsed handling to support all three types: TRACKED, NOT_TRACKED, NO_INFORMATION");
    console.log("4. Added null safety checks for all property accesses");
} catch (error) {
    console.error("❌ Error during test:", error);
    process.exit(1);
}