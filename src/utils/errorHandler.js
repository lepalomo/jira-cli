/**
 * Standardized error handling utilities for Jira CLI
 * Provides consistent error extraction, formatting, and batch result reporting
 */

const operationLogger = require('./operationLogger');

/**
 * Safely serialize an object to string, handling circular references
 * @param {any} obj - Object to serialize
 * @returns {string} Safe string representation
 */
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }
        return value;
    });
}

/**
 * Extract meaningful error message from various error object structures
 * @param {Error|Object} error - Error object from Jira API, network, or validation
 * @returns {string} Human-readable error message
 */
function getErrorMessage(error) {
    if (!error) {
        return 'Unknown error occurred';
    }

    // Handle Jira API error responses
    if (error.response) {
        const { data, status, statusText } = error.response;
        
        // Jira API error messages can be in different formats
        if (data && data.errorMessages && Array.isArray(data.errorMessages) && data.errorMessages.length > 0) {
            return data.errorMessages.join('; ');
        }
        
        if (data && data.errors && typeof data.errors === 'object') {
            const errorEntries = Object.entries(data.errors);
            if (errorEntries.length > 0) {
                return errorEntries.map(([key, value]) => `${key}: ${value}`).join('; ');
            }
        }
        
        if (data && data.message) {
            return data.message;
        }
        
        // Handle status with or without statusText
        if (status) {
            if (statusText) {
                return `${status} ${statusText}`;
            } else {
                return `HTTP ${status}`;
            }
        }
    }
    
    // Handle non-Jira API errors with .data property (e.g., Axios errors without .response)
    if (error.data) {
        const { data } = error;
        
        if (data.errorMessages && Array.isArray(data.errorMessages) && data.errorMessages.length > 0) {
            return data.errorMessages.join('; ');
        }
        
        if (data.errors && typeof data.errors === 'object') {
            const errorEntries = Object.entries(data.errors);
            if (errorEntries.length > 0) {
                return errorEntries.map(([key, value]) => `${key}: ${value}`).join('; ');
            }
        }
        
        if (data.message) {
            return data.message;
        }
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
        return 'Connection refused - check Jira URL and network connectivity';
    }
    
    if (error.code === 'ETIMEDOUT') {
        return 'Request timeout - Jira server may be slow or unavailable';
    }
    
    if (error.code === 'ENOTFOUND') {
        return 'Host not found - check Jira URL';
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return error.message || 'Validation error';
    }
    
    // Handle permission errors with safe string conversion
    const errorMessageStr = error.message ? String(error.message) : '';
    if (errorMessageStr.includes('permission')) {
        return `Permission denied: ${errorMessageStr}`;
    }
    
    // Handle "not found" errors with safe string conversion
    if (errorMessageStr && (errorMessageStr.includes('not found') || errorMessageStr.includes('does not exist'))) {
        return `Resource not found: ${errorMessageStr}`;
    }
    
    // Fallback to error message or string representation
    if (errorMessageStr) {
        return errorMessageStr;
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    try {
        return safeStringify(error) || 'Unknown error occurred';
    } catch (stringifyError) {
        return `[Error object could not be serialized: ${stringifyError.message}]`;
    }
}

/**
 * Check if message contains a word or phrase with better precision
 * Uses regex with word boundaries for single words, exact matching for phrases
 * @param {string} message - Lowercase message to search
 * @param {string|Array} patterns - Word or array of words/phrases to match
 * @returns {boolean} True if message contains the pattern
 */
function containsPreciseMatch(message, patterns) {
    if (!message || !patterns) return false;
    
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const pattern of patternList) {
        // For multi-word phrases, use includes (they have spaces as natural boundaries)
        if (pattern.includes(' ')) {
            if (message.includes(pattern)) {
                return true;
            }
        } else {
            // For single words, use regex with word boundaries to avoid partial matches
            // Word boundary (\b) matches at word boundaries (alphanumeric vs non-alphanumeric)
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            if (regex.test(message)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Categorize error type for better reporting
 * @param {Error|Object} error - Error object
 * @returns {string} Error category
 */
function getErrorCategory(error) {
    if (!error) return 'unknown';
    
    const message = getErrorMessage(error).toLowerCase();
    
    // Permission errors
    if (containsPreciseMatch(message, ['permission', 'access denied', 'forbidden', 'unauthorized'])) {
        return 'permission';
    }
    
    // Not found errors
    if (containsPreciseMatch(message, ['not found', 'does not exist', 'invalid']) ||
        containsPreciseMatch(message, ['404', 'not exist'])) {
        return 'not_found';
    }
    
    // Validation errors
    if (containsPreciseMatch(message, ['validation', 'invalid', 'required', 'missing', 'malformed'])) {
        return 'validation';
    }
    
    // Network errors
    if (containsPreciseMatch(message, ['timeout', 'connection refused', 'network', 'econnrefused', 'enetunreach'])) {
        return 'network';
    }
    
    // Rate limit errors
    if (containsPreciseMatch(message, ['rate limit', 'too many requests', '429', 'rate exceeded'])) {
        return 'rate_limit';
    }
    
    // Conflict errors (already exists)
    if (containsPreciseMatch(message, ['already exists', 'duplicate', 'conflict', '409'])) {
        return 'conflict';
    }
    
    return 'unknown';
}

/**
 * Format batch operation results with detailed statistics
 * @param {Array} results - Array of result objects with {success: boolean, error?: string, ...}
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted results with statistics
 */
function formatBatchResults(results, options = {}) {
    if (!Array.isArray(results)) {
        return {
            total: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            errors: [],
            errorCategories: {},
            successItems: [],
            failedItems: []
        };
    }
    
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    // Extract error categories
    const errorCategories = {};
    failedResults.forEach(result => {
        const category = getErrorCategory(result.error);
        errorCategories[category] = (errorCategories[category] || 0) + 1;
    });
    
    // Extract specific items
    const successItems = successResults.map(r => ({
        identifier: r.identifier || r.key || r.id || r.issueIdOrKey || 'unknown',
        details: r
    }));
    
    const failedItems = failedResults.map(r => ({
        identifier: r.identifier || r.key || r.id || r.issueIdOrKey || 'unknown',
        error: getErrorMessage(r.error),
        category: getErrorCategory(r.error),
        details: r
    }));
    
    const total = results.length;
    const successCount = successResults.length;
    const failureCount = failedResults.length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
    
    return {
        total,
        successCount,
        failureCount,
        successRate,
        errors: failedResults.map(r => getErrorMessage(r.error)),
        errorCategories,
        successItems,
        failedItems,
        summary: {
            total,
            successCount,
            failureCount,
            successRate: `${successRate}%`,
            errorCategories
        }
    };
}

/**
 * Log comprehensive operation statistics
 * @param {string} operationId - Operation identifier
 * @param {Object} results - Formatted results from formatBatchResults
 * @param {Object} options - Logging options
 */
function logOperationSummary(operationId, results, options = {}) {
    const {
        showDetails = true,
        showErrors = true,
        showSuccesses = true,
        maxErrorsToShow = 10,
        maxSuccessesToShow = 5
    } = options;
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 OPERATION SUMMARY: ${operationId}`);
    console.log('='.repeat(80));
    
    // Basic statistics
    console.log(`\n📈 STATISTICS:`);
    console.log(`   Total items processed: ${results.total}`);
    console.log(`   Successes: ${results.successCount} (${results.successRate}%)`);
    console.log(`   Failures: ${results.failureCount}`);
    
    // Error categories
    if (results.failureCount > 0 && Object.keys(results.errorCategories).length > 0) {
        console.log(`\n⚠️  ERROR CATEGORIES:`);
        Object.entries(results.errorCategories).forEach(([category, count]) => {
            console.log(`   • ${category}: ${count} error(s)`);
        });
    }
    
    // Detailed errors (limited)
    if (showErrors && results.failedItems.length > 0) {
        console.log(`\n❌ FAILED ITEMS (${Math.min(results.failedItems.length, maxErrorsToShow)} of ${results.failedItems.length}):`);
        results.failedItems.slice(0, maxErrorsToShow).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.identifier}: ${item.error}`);
            if (item.category && item.category !== 'unknown') {
                console.log(`      Category: ${item.category}`);
            }
        });
        
        if (results.failedItems.length > maxErrorsToShow) {
            console.log(`   ... and ${results.failedItems.length - maxErrorsToShow} more failures`);
        }
    }
    
    // Successful items (limited)
    if (showSuccesses && results.successItems.length > 0) {
        console.log(`\n✅ SUCCESSFUL ITEMS (${Math.min(results.successItems.length, maxSuccessesToShow)} of ${results.successItems.length}):`);
        results.successItems.slice(0, maxSuccessesToShow).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.identifier}`);
        });
        
        if (results.successItems.length > maxSuccessesToShow) {
            console.log(`   ... and ${results.successItems.length - maxSuccessesToShow} more successes`);
        }
    }
    
    // Recommendations based on error patterns
    if (results.failureCount > 0) {
        console.log(`\n💡 RECOMMENDATIONS:`);
        
        if (results.errorCategories.permission) {
            console.log(`   • Check user permissions for the failed items`);
        }
        
        if (results.errorCategories.not_found) {
            console.log(`   • Verify that the resources exist`);
        }
        
        if (results.errorCategories.validation) {
            console.log(`   • Review input data for validation errors`);
        }
        
        if (results.errorCategories.rate_limit) {
            console.log(`   • Consider implementing rate limiting or retry logic`);
        }
        
        console.log(`   • Use the operation ID for troubleshooting: ${operationId}`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Log to operation logger if available
    try {
        operationLogger.logOperation(operationId, 'batch_operation', null, {
            statistics: results.summary,
            timestamp: new Date().toISOString()
        });
    } catch (logError) {
        // Silently continue if logging fails
    }
}

/**
 * Create a standardized error object with enhanced information
 * @param {Error|Object|string} error - Original error
 * @param {Object} context - Additional context information
 * @returns {Object} Enhanced error object
 */
function createEnhancedError(error, context = {}) {
    const message = getErrorMessage(error);
    const category = getErrorCategory(error);
    
    return {
        message,
        category,
        originalError: error,
        context,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
    };
}

/**
 * Format error for display with context
 * @param {Error|Object|string} error - Error to format
 * @param {string} operation - Operation being performed
 * @param {string} resource - Resource being operated on
 * @returns {string} Formatted error message
 */
function formatErrorWithContext(error, operation, resource) {
    const errorMessage = getErrorMessage(error);
    const category = getErrorCategory(error);
    
    let formatted = `Error ${operation} ${resource}: ${errorMessage}`;
    
    // Add category-specific guidance
    switch (category) {
        case 'permission':
            formatted += '\n   → Check user permissions and project access rights';
            break;
        case 'not_found':
            formatted += '\n   → Verify the resource exists and is accessible';
            break;
        case 'validation':
            formatted += '\n   → Review input data for validation issues';
            break;
        case 'network':
            formatted += '\n   → Check network connectivity and Jira URL';
            break;
        case 'rate_limit':
            formatted += '\n   → Rate limit exceeded - consider implementing retry logic';
            break;
    }
    
    return formatted;
}

module.exports = {
    getErrorMessage,
    getErrorCategory,
    formatBatchResults,
    logOperationSummary,
    createEnhancedError,
    formatErrorWithContext
};