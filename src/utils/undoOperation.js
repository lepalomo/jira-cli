const JiraApi = require('../services/jiraApi');
const { extractTextFromDoc } = require('../utils/docExtractor');

async function undoFieldOperation(config, options = {}) {
    const Loader = require('../utils/loader');
    const jira = new JiraApi(config.url, config.email, config.token);
    
    const { jql, issues, operationId, issueOperationId, targetField, exec = false } = options;
    
    if ((!jql && !issues && !operationId && !issueOperationId) || !targetField) {
        throw new Error('Must specify either --jql, --issues, --operation-id, or --issue-operation-id, and --target-field is required');
    }
    
    const multipleOptions = [jql, issues, operationId, issueOperationId].filter(Boolean).length;
    if (multipleOptions > 1) {
        throw new Error('Cannot specify multiple search methods. Choose one: --jql, --issues, --operation-id, or --issue-operation-id');
    }
    
    const loader = new Loader(`Finding issues and checking changelog for field ${targetField}`);
    loader.start();
    
    try {
        // Get issues either from JQL, direct issue keys/IDs, batch operation ID, or issue operation ID
        let allIssues = [];
        
        if (operationId) {
            // Search for issues by batch operation ID in comments
            const searchResults = await jira.findIssuesByOperationId(operationId);
            allIssues = searchResults.issues || [];
        } else if (issueOperationId) {
            // Search for issues by issue operation ID in comments
            const searchResults = await jira.findIssuesByIssueOperationId(issueOperationId);
            allIssues = searchResults.issues || [];
        } else if (jql) {
            // For JQL search, add filter for Jira CLI comments and recent updates
            // Extract ORDER BY clause if present
            const orderByMatch = jql.match(/\s+order\s+by\s+.+$/i);
            const baseJql = orderByMatch ? jql.replace(orderByMatch[0], '') : jql;
            const orderByClause = orderByMatch ? orderByMatch[0] : '';
            
            const enhancedJql = `(${baseJql}) AND comment ~ "Jira CLI" AND updated >= -24h${orderByClause}`;
            
            // Search for issues using enhanced JQL
            let startAt = 0;
            const maxResults = 100;
            let hasMore = true;
            
            while (hasMore) {
                const searchResults = await jira.searchIssues(enhancedJql, {
                    startAt,
                    maxResults,
                    fields: 'key',
                    expand: 'changelog'
                });
                
                if (searchResults.issues && searchResults.issues.length > 0) {
                    allIssues.push(...searchResults.issues);
                    startAt += maxResults;
                    hasMore = searchResults.issues.length === maxResults;
                } else {
                    hasMore = false;
                }
            }
        } else {
            // Use provided issue keys/IDs
            allIssues = issues.map(issue => ({ key: issue }));
        }
        
        loader.stop();
        
        if (allIssues.length === 0) {
            if (operationId) {
                console.log(`No issues found with batch operation ID: ${operationId}`);
            } else if (issueOperationId) {
                console.log(`No issues found with issue operation ID: ${issueOperationId}`);
            } else if (jql) {
                console.log('No issues found matching the JQL query.');
            } else {
                console.log('No issues provided.');
            }
            return [];
        }
        
        console.log(`Found ${allIssues.length} issues. Analyzing changelog for field ${targetField}...`);
        
        const undoOperations = [];
        let filteredOutCount = 0;
        let noChangelogCount = 0;
        let noJiraCLICommentCount = 0;
        let noMatchingTimeCount = 0;
        
        for (const issue of allIssues) {
            // Get full issue with changelog
            const fullIssue = await jira.getIssue(issue.key, {
                expand: 'changelog',
                fields: targetField
            });
            
            // Find the last change to the target field
            const changelog = fullIssue.changelog;
            if (!changelog || !changelog.histories) {
                noChangelogCount++;
                continue;
            }
            
            // Sort by created date (most recent first)
            const sortedHistories = changelog.histories.sort((a, b) => 
                new Date(b.created) - new Date(a.created)
            );
            
            // Find the most recent change to our target field
            let lastChange = null;
            let operationTimestamp = null;
            
            // Find operation timestamp from comments
            try {
                const comments = await jira.getIssueComments(issue.key);
                let targetComment = null;
                
                if (operationId) {
                    targetComment = comments.comments?.find(comment => {
                        const commentText = comment.body?.content?.[0]?.content?.[0]?.text || '';
                        return commentText.includes(`batch: ${operationId}`);
                    });
                } else if (issueOperationId) {
                    targetComment = comments.comments?.find(comment => {
                        const commentText = comment.body?.content?.[0]?.content?.[0]?.text || '';
                        return commentText.includes(`issue: ${issueOperationId}`);
                    });
                } else if (jql) {
                    // For JQL search, find the most recent "Jira CLI" comment
                    const jiraCLIComments = comments.comments?.filter(comment => {
                        const commentText = comment.body?.content?.[0]?.content?.[0]?.text || '';
                        return commentText.includes('Jira CLI');
                    }).sort((a, b) => new Date(b.created) - new Date(a.created));
                    
                    targetComment = jiraCLIComments?.[0];
                    if (!targetComment) {
                        noJiraCLICommentCount++;
                        continue;
                    }
                }
                
                if (targetComment) {
                    operationTimestamp = new Date(targetComment.created);
                }
            } catch (commentError) {
                // If we can't get comments, fall back to most recent change
            }
            
            let foundMatchingChange = false;
            for (const history of sortedHistories) {
                const fieldChange = history.items.find(item => item.field === targetField);
                if (fieldChange) {
                    // If we have operation timestamp, only consider changes around that time (±1 minute)
                    if (operationTimestamp) {
                        const changeTime = new Date(history.created);
                        const timeDiff = Math.abs(changeTime - operationTimestamp);
                        const oneMinute = 60 * 1000;
                        
                        if (timeDiff <= oneMinute) {
                            lastChange = fieldChange;
                            foundMatchingChange = true;
                            break;
                        }
                    } else {
                        // No operation timestamp, use most recent change
                        lastChange = fieldChange;
                        foundMatchingChange = true;
                        break;
                    }
                }
            }
            
            if (!foundMatchingChange && operationTimestamp) {
                noMatchingTimeCount++;
                continue;
            }
            
            if (lastChange) {
                let previousValue = lastChange.fromString || '';
                
                // Handle empty field representation
                if (previousValue === '...') {
                    previousValue = '';
                }
                
                undoOperations.push({
                    issueKey: issue.key,
                    field: targetField,
                    currentValue: lastChange.toString || '',
                    previousValue: previousValue
                });
            }
        }
        
        if (undoOperations.length === 0) {
            console.log(`No recent changes found for field ${targetField} in the specified issues.`);
            if (jql) {
                console.log(`\nFiltering summary:`);
                console.log(`- Issues without changelog: ${noChangelogCount}`);
                console.log(`- Issues without Jira CLI comments: ${noJiraCLICommentCount}`);
                console.log(`- Issues with no matching timestamp: ${noMatchingTimeCount}`);
            }
            return [];
        }
        
        console.log(`\nFound ${undoOperations.length} issues with recent changes to ${targetField}:`);
        if (jql && (noChangelogCount > 0 || noJiraCLICommentCount > 0 || noMatchingTimeCount > 0)) {
            console.log(`\nFiltered out ${allIssues.length - undoOperations.length} issues:`);
            if (noChangelogCount > 0) console.log(`- ${noChangelogCount} without changelog`);
            if (noJiraCLICommentCount > 0) console.log(`- ${noJiraCLICommentCount} without Jira CLI comments`);
            if (noMatchingTimeCount > 0) console.log(`- ${noMatchingTimeCount} with no matching timestamp`);
        }
        
        if (!exec) {
            console.log('\n[PREVIEW] The following changes would be reverted:');
            undoOperations.slice(0, 10).forEach(op => {
                console.log(`${op.issueKey}: "${op.currentValue.substring(0, 50)}..." → "${op.previousValue.substring(0, 50)}..."`);
            });
            if (undoOperations.length > 10) {
                console.log(`... and ${undoOperations.length - 10} more issues`);
            }
            console.log('\nTo execute the undo operation, add --exec');
            return undoOperations;
        }
        
        // Execute undo operations
        console.log(`\nExecuting undo operation for ${undoOperations.length} issues...`);
        
        const results = [];
        for (const operation of undoOperations) {
            try {
                let valueToSet = operation.previousValue;
                
                // Handle ADF fields when setting empty value
                if (valueToSet === '' && jira.requiresAdfFormat(operation.field)) {
                    valueToSet = {
                        type: 'doc',
                        version: 1,
                        content: []
                    };
                }
                
                await jira.updateIssueField(operation.issueKey, operation.field, valueToSet);
                results.push({ issueKey: operation.issueKey, success: true });
                console.log(`✓ ${operation.issueKey}: Reverted to previous value`);
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || error.message;
                results.push({ issueKey: operation.issueKey, success: false, error: errorMsg });
                console.log(`✗ ${operation.issueKey}: ${errorMsg}`);
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`\nUndo operation completed: ${successCount} successes, ${failureCount} failures`);
        
        return results;
        
    } catch (error) {
        loader.stop();
        throw error;
    }
}

module.exports = { undoFieldOperation };