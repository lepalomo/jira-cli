# Jira Issue Commands - Comprehensive Architecture Design

## Executive Summary
This document provides a complete architecture design for three new Jira issue commands to be integrated into the existing Jira Admin CLI codebase. The design follows established patterns, ensures consistency with existing code, and provides clear implementation guidelines.

## 1. Current Architecture Analysis

### 1.1 Codebase Structure
```
jiradmin/
├── index.js                    # CLI entry point with Commander.js
├── src/
│   ├── commands/
│   │   ├── commands.js         # All command implementations
│   │   └── config.js           # Encrypted configuration management
│   ├── services/
│   │   └── jiraApi.js          # Jira API client with timeout protection
│   └── utils/
│       ├── table.js            # Table formatting utilities
│       ├── loader.js           # Visual loading indicators
│       ├── timeout.js          # Timeout application utility
│       ├── emailLogger.js      # Email notification system
│       └── i18n.js             # Internationalization (if needed)
```

### 1.2 Key Design Patterns
1. **Modular Command Structure**: Each command is a separate async function in `commands.js`
2. **Consistent Error Handling**: Try-catch with loader management and user-friendly messages
3. **Batch Operations**: Support for comma-separated IDs with success/failure tracking
4. **Configuration Integration**: All commands accept config overrides via CLI options
5. **Timeout Protection**: 120-second timeout applied to all operations
6. **Table Output**: Consistent formatting using `cli-table3` utilities

### 1.3 Existing JiraApi Class Pattern
- Constructor: `new JiraApi(url, email, token)`
- Methods return promises with consistent error handling
- Batch methods return arrays of `{success: boolean, error?: string, data?: any}`

## 2. New JiraApi Extensions

### 2.1 Issue Retrieval Methods

#### `getIssue(issueIdOrKey, options = {})`
```javascript
/**
 * Retrieve a single issue by ID or key
 * @param {string} issueIdOrKey - Issue ID (numeric) or key (e.g., PROJ-123)
 * @param {Object} options - Optional parameters
 * @param {string} options.fields - Comma-separated list of fields to include
 * @param {string} options.expand - Comma-separated list of expansions
 * @param {Array} options.properties - Properties to include
 * @returns {Object} Issue data
 * @throws {Error} If issue not found or API error
 */
```

#### `searchIssues(jql, options = {})`
```javascript
/**
 * Search issues using JQL
 * @param {string} jql - JQL query string
 * @param {Object} options - Optional parameters
 * @param {number} options.startAt - Pagination start index (default: 0)
 * @param {number} options.maxResults - Maximum results per page (default: 50)
 * @param {string} options.fields - Comma-separated list of fields
 * @param {string} options.expand - Comma-separated list of expansions
 * @returns {Array} Array of issues matching the query
 */
```

#### `getIssuesBatch(issueIdsOrKeys, options = {})`
```javascript
/**
 * Retrieve multiple issues by IDs or keys
 * @param {Array} issueIdsOrKeys - Array of issue IDs or keys
 * @param {Object} options - Optional parameters
 * @param {string} options.fields - Comma-separated list of fields
 * @param {string} options.expand - Comma-separated list of expansions
 * @returns {Array} Array of results with {success: boolean, data?: Object, error?: string}
 */
```

### 2.2 Issue Field Update Methods

#### `updateIssueField(issueIdOrKey, fieldId, value)`
```javascript
/**
 * Update a single field on an issue
 * @param {string} issueIdOrKey - Issue ID or key
 * @param {string} fieldId - Field ID (e.g., 'summary', 'customfield_10010')
 * @param {string|Object} value - Field value (string for text fields)
 * @returns {Object} Update result with success status
 */
```

#### `updateIssueFieldsBatch(issueUpdates)`
```javascript
/**
 * Update fields on multiple issues
 * @param {Array} issueUpdates - Array of update objects
 * @param {string} issueUpdates[].issueIdOrKey - Issue ID or key
 * @param {string} issueUpdates[].fieldId - Field ID
 * @param {string} issueUpdates[].value - Field value
 * @returns {Array} Array of results with success/failure status
 */
```

### 2.3 Field Copy Methods

#### `copyFieldValue(sourceIssueIdOrKey, targetIssueIdOrKey, sourceFieldId, targetFieldId, options = {})`
```javascript
/**
 * Copy field value from one issue to another
 * @param {string} sourceIssueIdOrKey - Source issue ID or key
 * @param {string} targetIssueIdOrKey - Target issue ID or key
 * @param {string} sourceFieldId - Source field ID
 * @param {string} targetFieldId - Target field ID
 * @param {Object} options - Optional parameters
 * @param {boolean} options.append - Append instead of replace (default: false)
 * @param {string} options.separator - Separator for append mode (default: ', ')
 * @returns {Object} Copy result with success status
 */
```

#### `copyFieldValuesBatch(copyOperations)`
```javascript
/**
 * Copy field values in batch operations
 * @param {Array} copyOperations - Array of copy operation objects
 * @param {string} copyOperations[].sourceIssueIdOrKey - Source issue
 * @param {string} copyOperations[].targetIssueIdOrKey - Target issue
 * @param {string} copyOperations[].sourceFieldId - Source field
 * @param {string} copyOperations[].targetFieldId - Target field
 * @param {Object} copyOperations[].options - Copy options
 * @returns {Array} Array of results with success/failure status
 */
```

## 3. Command Architecture

### 3.1 `get-issue` Command

#### CLI Interface
```bash
jira-cli get-issue [options]

Options:
  -i, --issue <issue>        Issue ID or key (e.g., PROJ-123)
  -j, --jql <jql>            JQL query to search for issues
  -k, --keys <keys>          Comma-separated issue keys/IDs
  -f, --fields <fields>      Comma-separated list of fields to include
  -e, --expand <expand>      Comma-separated list of expansions
  -o, --output <format>      Output format: table, json, csv (default: table)
  --max-results <number>     Maximum results for JQL queries (default: 50)
  --raw                      Output raw JSON response
  -u, --url <url>            Jira instance URL
  -e, --email <email>        Jira user email
  -t, --token <token>        Jira API token
```

#### Implementation Pattern
```javascript
async function getIssue(config, options) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Fetching issue data');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        let issues = [];
        
        if (options.issue) {
            const issue = await jira.getIssue(options.issue, {
                fields: options.fields,
                expand: options.expand
            });
            issues = [issue];
        } else if (options.jql) {
            issues = await jira.searchIssues(options.jql, {
                fields: options.fields,
                expand: options.expand,
                maxResults: options.maxResults || 50
            });
        } else if (options.keys) {
            const issueKeys = options.keys.split(',').map(k => k.trim());
            const results = await jira.getIssuesBatch(issueKeys, {
                fields: options.fields,
                expand: options.expand
            });
            issues = results.filter(r => r.success).map(r => r.data);
        }
        
        loader.stop();
        
        if (options.raw || options.output === 'json') {
            console.log(JSON.stringify(issues, null, 2));
        } else if (options.output === 'csv') {
            outputAsCsv(issues);
        } else {
            const { createIssuesTable } = require('../utils/table');
            console.log(createIssuesTable(issues));
        }
    } catch (error) {
        loader.stop();
        throw error;
    }
}
```

### 3.2 `set-issue-field-value` Command

#### CLI Interface
```bash
jira-cli set-issue-field-value [options]

Options:
  -i, --issue <issue>        Issue ID or key (required)
  -k, --keys <keys>          Comma-separated issue keys/IDs
  -f, --field <field>        Field ID (e.g., summary, customfield_10010) (required)
  -v, --value <value>        Field value (required)
  --dry-run                  Preview changes without applying
  --confirm                  Require confirmation before applying
  -u, --url <url>            Jira instance URL
  -e, --email <email>        Jira user email
  -t, --token <token>        Jira API token
```

#### Implementation Pattern
```javascript
async function setIssueFieldValue(config, options) {
    const jira = new JiraApi(config.url, config.email, config.token);
    
    const updates = [];
    if (options.keys) {
        const issueKeys = options.keys.split(',').map(k => k.trim());
        updates.push(...issueKeys.map(key => ({
            issueIdOrKey: key,
            fieldId: options.field,
            value: options.value
        })));
    } else if (options.issue) {
        updates.push({
            issueIdOrKey: options.issue,
            fieldId: options.field,
            value: options.value
        });
    }
    
    if (options.dryRun) {
        console.log(`Would update ${updates.length} issue(s):`);
        updates.forEach(update => {
            console.log(`  ${update.issueIdOrKey}: ${update.fieldId} = "${update.value}"`);
        });
        return;
    }
    
    if (options.confirm && updates.length > 0) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question(`Confirm updating ${updates.length} issue(s)? (Y/N): `, resolve);
        });
        rl.close();
        
        if (answer.toUpperCase() !== 'Y') {
            console.log('Operation cancelled.');
            return;
        }
    }
    
    const results = await jira.updateIssueFieldsBatch(updates);
    
    console.log(`Results (${results.length} updates):`);
    console.log('='.repeat(60));
    results.forEach(result => {
        if (result.success) {
            console.log(`✓ ${result.issueIdOrKey}: ${result.fieldId} updated successfully`);
        } else {
            console.log(`✗ ${result.issueIdOrKey}: ${result.fieldId} failed - ${result.error}`);
        }
    });
}
```

### 3.3 `copy-item-fields-values` Command

#### CLI Interface
```bash
jira-cli copy-item-fields-values [options]

Options:
  -s, --source <source>      Source issue ID or key (required)
  -t, --target <target>      Target issue ID or key (required)
  --sources <sources>        Comma-separated source issue keys/IDs
  --targets <targets>        Comma-separated target issue keys/IDs
  -f, --field <field>        Single field ID to copy
  --fields <fields>          Comma-separated field IDs to copy
  --field-map <map>          Field mapping: source1:target1,source2:target2
  --append                   Append values instead of replacing
  --separator <separator>    Separator for append mode (default: ', ')
  --dry-run                  Preview changes without applying
  --confirm                  Require confirmation before applying
  -u, --url <url>            Jira instance URL
  -e, --email <email>        Jira user email
  -t, --token <token>        Jira API token
```

#### Implementation Pattern
```javascript
async function copyItemFieldsValues(config, options) {
    const jira = new JiraApi(config.url, config.email, config.token);
    
    const fieldMappings = parseFieldMappings(options);
    const copyOperations = prepareCopyOperations(options, fieldMappings);
    
    if (options.dryRun) {
        displayCopyPreview(copyOperations);
        return;
    }
    
    if (options.confirm && copyOperations.length > 0) {
        if (!await requestConfirmation(copyOperations.length)) {
            console.log('Operation cancelled.');
            return;
        }
    }
    
    const results = await jira.copyFieldValuesBatch(copyOperations);
    displayCopyResults(results);
}
```

## 4. Table Formatting Design

### 4.1 `createIssuesTable(issues)` Function
```javascript
function createIssuesTable(issues) {
    const Table = require('cli-table3');
    const table = new Table({
        head: ['Key', 'Summary', 'Type', 'Status', 'Assignee', 'Created', 'Updated'],
        colWidths: [12, 50, 15, 15, 25, 20, 20]
    });

    issues.forEach(issue => {
        table.push([
            issue.key || 'N/A',
            issue.fields?.summary || 'No summary',
            issue.fields?.issuetype?.name || 'N/A',
            issue.fields?.status?.name || 'N/A',
            issue.fields?.assignee?.displayName || 'Unassigned',
            formatDate(issue.fields?.created),
            formatDate(issue.fields?.updated)
        ]);
    });

    return table.toString();
}
```

### 4.2 Field-Specific Formatting Utilities
```javascript
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US');
    } catch {
        return dateString;
    }
}

function truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
```

## 5. Integration Plan

### 5.1 File Modifications Required

#### `src/services/jiraApi.js`
- Add new issue retrieval methods (`getIssue`, `searchIssues`, `getIssuesBatch`)
- Add field update methods (`updateIssueField`, `updateIssueFieldsBatch`)
- Add field copy methods (`copyFieldValue`, `copyFieldValuesBatch`)

#### `src/commands/commands.js`
- Add three new command functions: `getIssue`, `setIssueFieldValue`, `copyItemFieldsValues`
- Export new functions from module
- Apply timeout protection via `applyTimeoutToObject`

#### `src/utils/table.js`
- Add `createIssuesTable` function for issue display
- Add helper functions for date formatting and text truncation

#### `index.js`
- Register three new CLI commands with Commander.js
- Define command options and argument parsing
- Connect commands to their implementations

### 5.2 Integration Steps
1. **Phase 1: JiraApi Extensions**
   - Implement issue retrieval methods
   - Implement field update methods  
   - Implement field copy methods
   - Test each method independently

2. **Phase 2: Command Implementations**
   - Create `getIssue` command with loader and table output
   - Create `setIssueFieldValue` command with dry-run and confirmation
   - Create `copyItemFieldsValues` command with field mapping support
   - Add timeout protection to all commands

3. **Phase 3: Table Formatting**
   - Design and implement `createIssuesTable` function
   - Add helper utilities for date/text formatting
   - Test table output with sample data

4. **Phase 4: CLI Integration**
   - Register commands in `index.js`
   - Define command options and validation
   - Test end-to-end functionality

5. **Phase 5: Testing & Validation**
   - Unit tests for new JiraApi methods
   - Integration tests for command workflows
   - Edge case testing (empty results, errors, timeouts)

## 6. Error Handling Strategy

### 6.1 Common Error Scenarios
1. **Authentication Errors**: Invalid credentials or expired tokens
2. **Permission Errors**: User lacks permission for requested operation
3. **Validation Errors**: Invalid field IDs, issue keys, or JQL syntax
4. **Network Errors**: Timeouts, connection failures, rate limiting
5. **Data Errors**: Missing fields, incompatible field types

### 6.2 Error Handling Implementation
```javascript
// Consistent error handling pattern
try {
    const result = await jira.someMethod(params);
    // Process success
} catch (error) {
    if (error.response) {
        // API error with response
        const errorMsg = error.response.data?.errorMessages?.[0] || 
                        error.response.data?.errors || 
                        error.message;
        throw new Error(`Jira API error: ${errorMsg}`);
    } else if (error.request) {
        // Network error
        throw new Error(`Network error: ${error.message}`);
    } else {
        // Other errors
        throw error;
    }
}
```

## 7. Performance Considerations

### 7.1 Batch Operation Optimization
- Use parallel processing for independent operations
- Implement configurable batch sizes (default: 10 concurrent)
- Add progress indicators for large batches
- Implement retry logic for transient failures

### 7.2 Memory Management
- Stream large result sets instead of loading all at once
- Implement pagination for JQL queries with many results
- Clean up temporary data structures promptly

### 7.3 Timeout Configuration
- Maintain existing 120-second timeout for consistency
- Allow configurable timeouts for specific operations
- Provide clear timeout error messages with recovery suggestions

## 8. Testing Strategy

### 8.1 Unit Testing
- Test each JiraApi method independently with mocked responses
- Test command functions with mocked JiraApi instances
- Test table formatting with various data scenarios

### 8.2 Integration Testing
- Test end-to-end command execution with test Jira instance
- Verify batch operation success/failure tracking
- Test error handling and recovery scenarios

### 8.3 Edge Case Testing
- Empty result sets from JQL queries
- Invalid field IDs and issue keys
- Permission denied scenarios
- Network timeout simulations

## 9. Deployment Considerations

### 9.1 Backward Compatibility
- New commands don't affect existing functionality
- Maintain existing API interfaces and error formats
- Follow same configuration and authentication patterns

### 9.2 Documentation Updates
- Update README.md with new command documentation
- Add examples and use cases for each new command
- Include troubleshooting guidance for common issues

### 9.3 Version Management
- Increment minor version for feature addition
- Update package.json version accordingly
- Consider semantic versioning for API changes

## 10. Success Metrics

### 10.1 Functional Requirements
- All three commands implemented and working
- Consistent with existing codebase patterns
- Proper error handling and user feedback
- Support for all required input types (JQL, IDs, keys)

### 10.2 Quality Requirements
- Code follows existing style and conventions
- Comprehensive test coverage
- Clear documentation and examples
- Performance comparable to existing commands

## 11. Risk Mitigation

### 11.1 Technical Risks
- **Jira API rate limiting**: Implement exponential backoff and retry logic
- **Large data sets**: Implement pagination and streaming
- **Complex field mappings**: Provide clear validation and error messages

### 11.2 Operational Risks
- **User error with destructive operations**: Require confirmation for updates
- **Incorrect field mappings**: Provide dry-run mode for preview
- **Permission issues**: Clear error messages with resolution suggestions

## 12. Conclusion

This architecture design provides a comprehensive plan for implementing three new Jira issue commands that integrate seamlessly with the existing Jira Admin CLI codebase. The design:

1. **Follows established patterns** from the existing codebase
2. **Provides clear implementation guidelines** for each component
3. **Includes error handling and performance considerations**
4. **Offers a phased integration plan** for smooth implementation
5. **Addresses potential risks** with mitigation strategies

The implementation can proceed in logical phases, with each phase building on the previous one to ensure quality and consistency with the existing codebase.

## Appendix A: Implementation Checklist

### Phase 1: JiraApi Extensions
- [ ] Implement `getIssue` method
- [ ] Implement `searchIssues` method
- [ ] Implement `getIssuesBatch` method
- [ ] Implement `updateIssueField` method
- [ ] Implement `updateIssueFieldsBatch` method
- [ ] Implement `copyFieldValue` method
- [ ] Implement `copyFieldValuesBatch` method
- [ ] Unit test all new methods

### Phase 2: Command Functions
- [ ] Implement `getIssue` command function
- [ ] Implement `setIssueFieldValue` command function
- [ ] Implement `copyItemFieldsValues` command function
- [ ] Apply timeout protection to all commands
- [ ] Test command functions with mocked API

### Phase 3: Table Formatting
- [ ] Implement `createIssuesTable` function
- [ ] Add date formatting utilities
- [ ] Add text truncation utilities
- [ ] Test table output with sample data

### Phase 4: CLI Integration
- [ ] Register commands in `index.js`
- [ ] Define command options and validation
- [ ] Test end-to-end functionality
- [ ] Update README documentation

### Phase 5: Final Testing
- [ ] Integration testing with real Jira instance
- [ ] Performance testing with large data sets
- [ ] Edge case and error scenario testing
- [ ] User acceptance testing

## Appendix B: Sample Usage Examples

### get-issue Examples
```bash
# Get single issue
jira-cli get-issue --issue PROJ-123

# Search with JQL
jira-cli get-issue --jql "project = PROJ AND status = Open" --max-results 20

# Multiple issues
jira-cli get-issue --keys "PROJ-123,PROJ-124,PROJ-125"

# With field expansion
jira-cli get-issue --issue PROJ-123 --fields "summary,description,assignee" --expand "renderedFields"
```

### set-issue-field-value Examples
```bash
# Update single issue
jira-cli set-issue-field-value --issue PROJ-123 --field summary --value "New summary text"

# Update multiple issues
jira-cli set-issue-field-value --keys "PROJ-123,PROJ-124" --field customfield_10010 --value "Updated value"

# Dry run preview
jira-cli set-issue-field-value --issue PROJ-123 --field description --value "New description" --dry-run

# With confirmation
jira-cli set-issue-field-value --keys "PROJ-123,PROJ-124" --field summary --value "Updated" --confirm
```

### copy-item-fields-values Examples
```bash
# Copy single field
jira-cli copy-item-fields-values --source PROJ-123 --target PROJ-124 --field description

# Copy multiple fields
jira-cli copy-item-fields-values --source PROJ-123 --target PROJ-124 --fields "summary,description,priority"

# With field mapping
jira-cli copy-item-fields-values --source PROJ-123 --target PROJ-124 --field-map "customfield_10010:customfield_10020,summary:description"

# Append mode
jira-cli copy-item-fields-values --source PROJ-123 --target PROJ-124 --field comments --append --separator "; "

# Batch copy
jira-cli copy-item-fields-values --sources "PROJ-123,PROJ-124" --targets "PROJ-125,PROJ-126" --field description
```

---
*Architecture Design Document v1.0 - Complete*