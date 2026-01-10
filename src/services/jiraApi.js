const https = require('https');
const { extractTextFromDoc } = require('../utils/docExtractor');
const { convertToJiraFormat, isAdfDocument, appendToAdf, textToAdf } = require('../utils/docConverter');
const operationLogger = require('../utils/operationLogger');
const RateLimitHandler = require('../utils/rateLimitHandler');

class JiraApi {
    constructor(url, email, token) {
        // Normalize URL: ensure it has a protocol
        this.url = this.normalizeUrl(url);
        this.auth = Buffer.from(`${email}:${token}`).toString('base64');
        this.timeout = 120000; // 120 seconds timeout
        this.rateLimitHandler = new RateLimitHandler();
    }

    /**
     * Make HTTP request using native https module
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} path - API path
     * @param {Object} data - Request body data (optional)
     * @param {Object} params - Query parameters (optional)
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(method, path, data = null, params = null) {
        const url = new URL(path, this.url);
        
        // Add query parameters
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
        }

        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json',
                'User-Agent': 'jira-cli/1.0.0'
            }
        };

        if (postData) {
            options.headers['Content-Type'] = 'application/json;charset=UTF-8';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsedData);
                        } else {
                            reject({
                                response: {
                                    status: res.statusCode,
                                    statusText: res.statusMessage,
                                    data: parsedData,
                                    headers: res.headers
                                }
                            });
                        }
                    } catch (parseError) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({});
                        } else {
                            reject({
                                response: {
                                    status: res.statusCode,
                                    statusText: res.statusMessage,
                                    data: { errorMessages: [responseData] },
                                    headers: res.headers
                                }
                            });
                        }
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(this.timeout, () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.timeout}ms`));
            });
            
            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    /**
     * Normalize URL by ensuring it has a protocol (https://)
     * @param {string} url - The URL to normalize
     * @returns {string} Normalized URL with protocol
     */
    normalizeUrl(url) {
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

    async listProjects(options = {}) {
        let allProjects = [];
        let startAt = 0;
        const maxResults = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await this.makeRequest('GET', '/rest/api/3/project/search', null, {
                expand: 'insight,projectCategory,lead',
                status: options.status || 'live',
                orderBy: '-lastIssueUpdatedTime',
                startAt: startAt,
                maxResults: maxResults
            });
            
            allProjects = allProjects.concat(response.values);
            hasMore = !response.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async archiveProject(projectKey) {
        await this.makeRequest('PUT', `/rest/api/3/project/${projectKey}/archive`, {});
    }

    async updateProject(projectKey, updates) {
        return await this.makeRequest('PUT', `/rest/api/3/project/${projectKey}`, updates);
    }

    async updateProjectCategory(projectKey, categoryId) {
        return await this.makeRequest('PUT', `/rest/api/3/project/${projectKey}`, {
            categoryId: parseInt(categoryId)
        });
    }

    async listCategories() {
        return await this.makeRequest('GET', '/rest/api/3/projectCategory');
    }

    async getUnusedProjects() {
        return await this.listProjects({ status: 'archived' });
    }

    async archiveProjects(projectKeys) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.rateLimitHandler.handleWithRetry(
                    () => this.archiveProject(key),
                    `archiveProject-${key}`
                );
                results.push({ key, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || error.message;
                results.push({ key, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async updateProjectsCategory(projectKeys, categoryId) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.rateLimitHandler.handleWithRetry(
                    () => this.updateProjectCategory(key, categoryId),
                    `updateProjectCategory-${key}`
                );
                results.push({ key, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || 
                                error.response?.data?.errors || 
                                error.message;
                results.push({ key, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async listProjectsByCategory(categoryId) {
        let allProjects = [];
        let startAt = 0;
        const maxResults = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await this.makeRequest('GET', '/rest/api/3/project/search', null, {
                expand: 'insight,projectCategory,lead',
                status: 'live',
                categoryId: categoryId,
                orderBy: '-lastIssueUpdatedTime',
                startAt: startAt,
                maxResults: maxResults
            });
            
            allProjects = allProjects.concat(response.values);
            hasMore = !response.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async deleteProject(projectKey) {
        await this.makeRequest('DELETE', `/rest/api/3/project/${projectKey}`);
    }

    async deleteProjects(projectKeys) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.rateLimitHandler.handleWithRetry(
                    () => this.deleteProject(key),
                    `deleteProject-${key}`
                );
                results.push({ key, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || 
                                error.response?.data?.errors || 
                                error.message;
                results.push({ key, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async searchIssues(jql, options = {}) {
        const params = {
            jql: jql,
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50
        };
        
        if (options.fields) {
            if (Array.isArray(options.fields)) {
                params.fields = options.fields.join(',');
            } else {
                params.fields = options.fields;
            }
        }
        if (options.expand) {
            if (Array.isArray(options.expand)) {
                params.expand = options.expand.join(',');
            } else {
                params.expand = options.expand;
            }
        }
        if (options.validateQuery !== undefined) params.validateQuery = options.validateQuery;

        console.log(`[DEBUG] JQL Search Request:`, JSON.stringify(params, null, 2));
        console.log(`[DEBUG] Request URL: ${this.url}/rest/api/3/search/jql`);

        return await this.makeRequest('GET', '/rest/api/3/search/jql', null, params);
    }

    async getIssue(issueIdOrKey, options = {}) {
        const params = {};
        
        if (options.fields) params.fields = options.fields;
        if (options.expand) params.expand = options.expand;
        if (options.properties) params.properties = options.properties;
        if (options.updateHistory !== undefined) params.updateHistory = options.updateHistory;

        return await this.makeRequest('GET', `/rest/api/3/issue/${issueIdOrKey}`, null, params);
    }

    async getIssuesBatch(issueIdsOrKeys, options = {}) {
        const results = [];
        
        for (const issueIdOrKey of issueIdsOrKeys) {
            try {
                const issue = await this.rateLimitHandler.handleWithRetry(
                    () => this.getIssue(issueIdOrKey, options),
                    `getIssue-${issueIdOrKey}`
                );
                results.push({ issueIdOrKey, success: true, data: issue });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ issueIdOrKey, success: false, error: errorMsg });
            }
        }
        
        return results;
    }

    requiresAdfFormat(fieldId, value = null) {
        const knownAdfFields = ['description', 'environment'];
        
        if (knownAdfFields.includes(fieldId)) {
            return true;
        }
        
        if (fieldId.startsWith('customfield_') && value !== null) {
            return isAdfDocument(value);
        }
        
        return false;
    }

    async addComment(issueIdOrKey, comment) {
        const commentData = {
            body: {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{
                        type: 'text',
                        text: comment
                    }]
                }]
            }
        };
        
        return await this.makeRequest('POST', `/rest/api/3/issue/${issueIdOrKey}/comment`, commentData);
    }

    async addOperationComment(issueIdOrKey, batchOperationId, issueOperationId) {
        const comment = `Jira CLI batch: ${batchOperationId} | issue: ${issueOperationId}`;
        return await this.addComment(issueIdOrKey, comment);
    }

    async getIssueComments(issueIdOrKey) {
        return await this.makeRequest('GET', `/rest/api/3/issue/${issueIdOrKey}/comment`);
    }

    async findIssuesByOperationId(operationId) {
        const jql = `comment ~ "Jira CLI batch: ${operationId}"`;
        return await this.searchIssues(jql, {
            fields: 'key',
            maxResults: 1000
        });
    }

    async findIssuesByIssueOperationId(issueOperationId) {
        const jql = `comment ~ "issue: ${issueOperationId}"`;
        return await this.searchIssues(jql, {
            fields: 'key',
            maxResults: 1000
        });
    }

    async updateIssueField(issueIdOrKey, fieldId, value, options = {}) {
        const operationId = operationLogger.generateOperationId();
        const batchOperationId = options.batchOperationId || operationId;
        const encodedIssueIdOrKey = encodeURIComponent(issueIdOrKey);
        let currentValue;
        
        try {
            const issue = await this.getIssue(issueIdOrKey, { fields: fieldId });
            currentValue = issue.fields?.[fieldId];
        } catch (error) {
            const errorMsg = error.response?.data?.errorMessages?.[0] ||
                            error.response?.data?.errors ||
                            error.message;
            throw new Error(`Cannot access issue ${issueIdOrKey}: ${errorMsg}`);
        }
        
        let finalValue = value;
        
        // Handle ADF fields (description, environment, etc.)
        if (this.requiresAdfFormat(fieldId, currentValue)) {
            if (options.append && currentValue !== null && currentValue !== undefined) {
                // Append to existing ADF document
                finalValue = appendToAdf(currentValue, value, 'paragraph');
            } else {
                // Create new ADF document
                if (isAdfDocument(value)) {
                    // Value is already an ADF document, use it directly
                    finalValue = value;
                } else {
                    // Convert string or other value to ADF
                    finalValue = textToAdf(String(value));
                }
            }
        } else {
            // Handle regular text fields
            if (options.append && currentValue !== null && currentValue !== undefined) {
                const separator = options.separator || '\n\n';
                let currentText = currentValue;
                if (typeof currentValue === 'object') {
                    currentText = JSON.stringify(currentValue);
                }
                finalValue = `${currentText}${separator}${value}`;
            }
        }
        
        const updateData = {
            fields: {
                [fieldId]: finalValue
            }
        };

        try {
            const result = await this.makeRequest('PUT', `/rest/api/3/issue/${encodedIssueIdOrKey}`, updateData);
            
            // Log the operation
            operationLogger.logOperation(operationId, 'updateField', issueIdOrKey, {
                fieldId: fieldId,
                append: options.append || false,
                valueLength: String(value).length,
                batchOperationId: batchOperationId
            });
            
            // Add comment to the issue with both batch and issue operation IDs
            try {
                await this.addOperationComment(issueIdOrKey, batchOperationId, operationId);
            } catch (commentError) {
                console.warn(`Warning: Could not add comment to ${issueIdOrKey}: ${commentError.message}`);
            }
            
            return result;
        } catch (error) {
            const errorMsg = error.response?.data?.errorMessages?.[0] || '';
            const errorDetails = error.response?.data?.errors || {};
            
            if (errorMsg.includes('permission') || errorMsg.includes('does not exist') || Object.keys(errorDetails).length > 0) {
                throw new Error(`Cannot update field '${fieldId}' on issue ${issueIdOrKey}: You have read access but may not have permission to update it. Original error: ${errorMsg}`);
            }
            
            throw error;
        }
    }

    async updateIssueFieldsBatch(issueIdsOrKeys, fieldId, value, options = {}) {
        const batchOperationId = options.batchOperationId || require('../utils/operationLogger').generateOperationId();
        const results = [];
        
        for (const issueIdOrKey of issueIdsOrKeys) {
            try {
                await this.rateLimitHandler.handleWithRetry(
                    () => this.updateIssueField(issueIdOrKey, fieldId, value, { ...options, batchOperationId }),
                    `updateIssueField-${issueIdOrKey}-${fieldId}`
                );
                results.push({ issueIdOrKey, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ issueIdOrKey, success: false, error: errorMsg });
            }
        }
        
        return results;
    }

    async copyMultipleFieldValues(sourceIssueIdOrKey, sourceFieldIds, targetFieldId, options = {}) {
        console.log(`[DEBUG] copyMultipleFieldValues called: issue=${sourceIssueIdOrKey}, sources=[${sourceFieldIds.join(', ')}], target=${targetFieldId}, append=${options.append}`);
        
        try {
            console.log(`[DEBUG] Checking issue access with minimal fields...`);
            await this.getIssue(sourceIssueIdOrKey, { fields: 'key' });
            console.log(`[DEBUG] Issue access confirmed`);
        } catch (error) {
            const errorMsg = error.response?.data?.errorMessages?.[0] ||
                            error.response?.data?.errors ||
                            error.message;
            console.log(`[DEBUG] Issue access failed: ${errorMsg}`);
            throw new Error(`Cannot access issue ${sourceIssueIdOrKey}: ${errorMsg}`);
        }
        
        let sourceIssue;
        const allFields = [...sourceFieldIds, targetFieldId].join(',');
        try {
            console.log(`[DEBUG] Attempting to get all fields: ${allFields}`);
            sourceIssue = await this.getIssue(sourceIssueIdOrKey, {
                fields: allFields
            });
            console.log(`[DEBUG] Successfully retrieved all fields`);
        } catch (error) {
            const errorMsg = error.response?.data?.errorMessages?.[0] || '';
            const errorDetails = error.response?.data?.errors || {};
            console.log(`[DEBUG] Combined field request failed: ${errorMsg}`, errorDetails);
            
            if (errorMsg.includes('permission') || Object.keys(errorDetails).length > 0) {
                throw new Error(`Cannot read target field '${targetFieldId}': You may not have permission to access this field. Original error: ${errorMsg}`);
            }
            throw error;
        }
        
        const targetFieldValue = sourceIssue.fields?.[targetFieldId];
        const targetIsAdf = this.requiresAdfFormat(targetFieldId, targetFieldValue);
        const fieldSeparator = options.fieldSeparator || '\n\n';
        
        // If target is ADF, we need to preserve ADF structure
        if (targetIsAdf) {
            console.log(`[DEBUG] Target field ${targetFieldId} is ADF format, preserving structure`);
            let combinedAdf = null;
            
            for (const fieldId of sourceFieldIds) {
                let fieldValue = sourceIssue.fields?.[fieldId];
                console.log(`[DEBUG] Processing field ${fieldId}: ${typeof fieldValue}`);
                
                if (fieldValue !== null && fieldValue !== undefined) {
                    if (isAdfDocument(fieldValue)) {
                        console.log(`[DEBUG] Field ${fieldId} is ADF document, preserving structure`);
                        if (combinedAdf === null) {
                            // Start with the first ADF document
                            combinedAdf = JSON.parse(JSON.stringify(fieldValue));
                        } else {
                            // Append subsequent ADF documents using appendToAdf
                            combinedAdf = appendToAdf(combinedAdf, fieldValue, 'paragraph');
                        }
                    } else {
                        // Convert non-ADF value to ADF
                        console.log(`[DEBUG] Field ${fieldId} is not ADF, converting to ADF`);
                        const textValue = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue);
                        const adfValue = textToAdf(textValue);
                        if (combinedAdf === null) {
                            combinedAdf = adfValue;
                        } else {
                            combinedAdf = appendToAdf(combinedAdf, adfValue, 'paragraph');
                        }
                    }
                } else {
                    console.log(`[DEBUG] Field ${fieldId} is null/undefined, skipping`);
                }
            }
            
            if (combinedAdf === null) {
                console.log(`[DEBUG] No values found in any source fields, skipping update`);
                return { skipped: true, reason: 'No values found in source fields' };
            }
            
            console.log(`[DEBUG] Combined ADF created, updating target field ${targetFieldId}`);
            try {
                return await this.updateIssueField(sourceIssueIdOrKey, targetFieldId, combinedAdf, options);
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || '';
                const errorDetails = error.response?.data?.errors || {};
                
                console.log(`[DEBUG] Update failed: ${errorMsg}`, errorDetails);
                
                if (errorMsg.includes('permission') || errorMsg.includes('does not exist') || Object.keys(errorDetails).length > 0) {
                    throw new Error(`Cannot update field '${targetFieldId}': You have read access to issue ${sourceIssueIdOrKey} but may not have permission to update it. Original error: ${errorMsg}`);
                }
                
                throw error;
            }
        } else {
            // Target is not ADF, use plain text extraction as before
            console.log(`[DEBUG] Target field ${targetFieldId} is not ADF, using plain text extraction`);
            const sourceValues = [];
            
            for (const fieldId of sourceFieldIds) {
                let fieldValue = sourceIssue.fields?.[fieldId];
                console.log(`[DEBUG] Processing field ${fieldId}: ${typeof fieldValue}`);
                
                if (fieldValue !== null && fieldValue !== undefined) {
                    if (typeof fieldValue === 'object') {
                        if (fieldValue.type === 'doc') {
                            console.log(`[DEBUG] Field ${fieldId} is doc type, extracting text`);
                            fieldValue = extractTextFromDoc(fieldValue);
                        } else {
                            console.log(`[DEBUG] Field ${fieldId} is complex object, converting to JSON`);
                            fieldValue = JSON.stringify(fieldValue);
                        }
                    }
                    sourceValues.push(String(fieldValue));
                } else {
                    console.log(`[DEBUG] Field ${fieldId} is null/undefined, skipping`);
                }
            }
            
            if (sourceValues.length === 0) {
                console.log(`[DEBUG] No values found in any source fields, skipping update`);
                return { skipped: true, reason: 'No values found in source fields' };
            }
            
            const combinedValue = sourceValues.join(fieldSeparator);
            console.log(`[DEBUG] Combined value created: length=${combinedValue.length}`);
            
            console.log(`[DEBUG] Updating target field ${targetFieldId} with combined value`);
            try {
                return await this.updateIssueField(sourceIssueIdOrKey, targetFieldId, combinedValue, options);
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || '';
                const errorDetails = error.response?.data?.errors || {};
                
                console.log(`[DEBUG] Update failed: ${errorMsg}`, errorDetails);
                
                if (errorMsg.includes('permission') || errorMsg.includes('does not exist') || Object.keys(errorDetails).length > 0) {
                    throw new Error(`Cannot update field '${targetFieldId}': You have read access to issue ${sourceIssueIdOrKey} but may not have permission to update it. Original error: ${errorMsg}`);
                }
                
                throw error;
            }
        }
    }

    async copyMultipleFieldValuesBatch(issueIdsOrKeys, sourceFieldIds, targetFieldId, options = {}) {
        const batchOperationId = options.batchOperationId || require('../utils/operationLogger').generateOperationId();
        const results = [];
        const batchSize = options.batchSize || 10;
        const chunkSize = options.chunkSize || 100;
        const onProgress = options.onProgress || (() => {});
        
        for (let i = 0; i < issueIdsOrKeys.length; i += chunkSize) {
            const chunk = issueIdsOrKeys.slice(i, i + chunkSize);
            const chunkResults = await this._processIssueChunk(chunk, sourceFieldIds, targetFieldId, { ...options, batchOperationId }, batchSize, onProgress, i);
            results.push(...chunkResults);
        }
        
        return results;
    }

    async _processIssueChunk(issueChunk, sourceFieldIds, targetFieldId, options, batchSize, onProgress, startIndex) {
        const results = [];
        
        for (let i = 0; i < issueChunk.length; i += batchSize) {
            const batch = issueChunk.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (issueIdOrKey) => {
                try {
                    return await this.rateLimitHandler.handleWithRetry(
                        () => this._processSingleIssueFieldCopy(issueIdOrKey, sourceFieldIds, targetFieldId, options),
                        `copyFieldValues-${issueIdOrKey}`
                    );
                } catch (error) {
                    const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                    error.response?.data?.errors ||
                                    error.message;
                    return { issueIdOrKey, success: false, error: errorMsg };
                }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            const processedResults = batchResults.map(result => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return { 
                        issueIdOrKey: 'unknown', 
                        success: false, 
                        error: result.reason?.message || 'Unknown error' 
                    };
                }
            });
            
            results.push(...processedResults);
            
            const processedCount = startIndex + i + batch.length;
            onProgress(processedCount);
            
            if (i + batchSize < issueChunk.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }

    async _processSingleIssueFieldCopy(issueIdOrKey, sourceFieldIds, targetFieldId, options) {
        const fieldsToGet = [...sourceFieldIds, targetFieldId].join(',');
        const issue = await this.getIssue(issueIdOrKey, { fields: fieldsToGet });
        
        const targetFieldValue = issue.fields?.[targetFieldId];
        const targetIsAdf = this.requiresAdfFormat(targetFieldId, targetFieldValue);
        const fieldSeparator = options.fieldSeparator || '\n\n';
        
        // If target is ADF, we need to preserve ADF structure
        if (targetIsAdf) {
            let combinedAdf = null;
            
            for (const fieldId of sourceFieldIds) {
                let fieldValue = issue.fields?.[fieldId];
                
                if (fieldValue !== null && fieldValue !== undefined) {
                    if (isAdfDocument(fieldValue)) {
                        if (combinedAdf === null) {
                            // Start with the first ADF document
                            combinedAdf = JSON.parse(JSON.stringify(fieldValue));
                        } else {
                            // Append subsequent ADF documents using appendToAdf
                            combinedAdf = appendToAdf(combinedAdf, fieldValue, 'paragraph');
                        }
                    } else {
                        // Convert non-ADF value to ADF
                        const textValue = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue);
                        const adfValue = textToAdf(textValue);
                        if (combinedAdf === null) {
                            combinedAdf = adfValue;
                        } else {
                            combinedAdf = appendToAdf(combinedAdf, adfValue, 'paragraph');
                        }
                    }
                }
            }
            
            if (combinedAdf === null) {
                return { issueIdOrKey, success: true, skipped: true, reason: 'No values found in source fields' };
            }
            
            await this.updateIssueField(issueIdOrKey, targetFieldId, combinedAdf, {
                ...options,
                batchOperationId: options.batchOperationId
            });
            return { issueIdOrKey, success: true };
        } else {
            // Target is not ADF, use plain text extraction as before
            const sourceValues = [];
            for (const fieldId of sourceFieldIds) {
                let fieldValue = issue.fields?.[fieldId];
                
                if (fieldValue !== null && fieldValue !== undefined) {
                    if (typeof fieldValue === 'object') {
                        if (fieldValue.type === 'doc') {
                            fieldValue = extractTextFromDoc(fieldValue);
                        } else {
                            fieldValue = JSON.stringify(fieldValue);
                        }
                    }
                    sourceValues.push(String(fieldValue));
                }
            }
            
            if (sourceValues.length === 0) {
                return { issueIdOrKey, success: true, skipped: true, reason: 'No values found in source fields' };
            }
            
            const combinedValue = sourceValues.join(fieldSeparator);
            
            await this.updateIssueField(issueIdOrKey, targetFieldId, combinedValue, {
                ...options,
                batchOperationId: options.batchOperationId
            });
            return { issueIdOrKey, success: true };
        }
    }

    async searchFields(params = {}) {
        const response = await this.makeRequest('GET', '/rest/api/3/field/search', null, params);
        return response.values || response;
    }

    /**
     * Get rate limit statistics and log
     * @returns {Object} - Rate limit summary and log
     */
    getRateLimitInfo() {
        return {
            summary: this.rateLimitHandler.getLogSummary(),
            log: this.rateLimitHandler.getRateLimitLog()
        };
    }

    /**
     * Clear rate limit log
     */
    clearRateLimitLog() {
        this.rateLimitHandler.clearLog();
    }
}

module.exports = JiraApi;