const https = require('https');
const { extractTextFromDoc } = require('../utils/docExtractor');
const { convertToJiraFormat, isAdfDocument, appendToAdf, textToAdf } = require('../utils/docConverter');
const operationLogger = require('../utils/operationLogger');
const RateLimitHandler = require('../utils/rateLimitHandler');
const { getErrorMessage } = require('../utils/errorHandler');

class JiraApi {
    constructor(url, email, token) {
        // Normalize URL: ensure it has a protocol
        this.url = this.normalizeUrl(url);
        this.auth = Buffer.from(`${email}:${token}`).toString('base64');
        this.timeout = 120000; // 120 seconds timeout
        this.rateLimitHandler = new RateLimitHandler();
        
        // Cache for workflow statuses to reduce API calls
        this.workflowStatusesCache = new Map();
        this.allStatusesCache = null;
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
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
                const errorMsg = getErrorMessage(error);
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
                const errorMsg = getErrorMessage(error);
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
                const errorMsg = getErrorMessage(error);
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
                const errorMsg = getErrorMessage(error);
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
            const errorMsg = getErrorMessage(error);
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
                const errorMsg = getErrorMessage(error);
                results.push({ issueIdOrKey, success: false, error: errorMsg });
            }
        }
        
        return results;
    }

    async copyMultipleFieldValues(sourceIssueIdOrKey, sourceFieldIds, targetFieldId, options = {}) {
        try {
            await this.getIssue(sourceIssueIdOrKey, { fields: 'key' });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            throw new Error(`Cannot access issue ${sourceIssueIdOrKey}: ${errorMsg}`);
        }
        
        let sourceIssue;
        const allFields = [...sourceFieldIds, targetFieldId].join(',');
        try {
            sourceIssue = await this.getIssue(sourceIssueIdOrKey, {
                fields: allFields
            });
        } catch (error) {
            const errorMsg = error.response?.data?.errorMessages?.[0] || '';
            const errorDetails = error.response?.data?.errors || {};
            
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
            let combinedAdf = null;
            
            for (const fieldId of sourceFieldIds) {
                let fieldValue = sourceIssue.fields?.[fieldId];
                
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
                return { skipped: true, reason: 'No values found in source fields' };
            }
            
            try {
                return await this.updateIssueField(sourceIssueIdOrKey, targetFieldId, combinedAdf, options);
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || '';
                const errorDetails = error.response?.data?.errors || {};
                
                if (errorMsg.includes('permission') || errorMsg.includes('does not exist') || Object.keys(errorDetails).length > 0) {
                    throw new Error(`Cannot update field '${targetFieldId}': You have read access to issue ${sourceIssueIdOrKey} but may not have permission to update it. Original error: ${errorMsg}`);
                }
                
                throw error;
            }
        } else {
            // Target is not ADF, use plain text extraction as before
            const sourceValues = [];
            
            for (const fieldId of sourceFieldIds) {
                let fieldValue = sourceIssue.fields?.[fieldId];
                
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
                return { skipped: true, reason: 'No values found in source fields' };
            }
            
            const combinedValue = sourceValues.join(fieldSeparator);
            
            try {
                return await this.updateIssueField(sourceIssueIdOrKey, targetFieldId, combinedValue, options);
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || '';
                const errorDetails = error.response?.data?.errors || {};
                
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
                    const errorMsg = getErrorMessage(error);
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
     * Get project details by key or ID
     * @param {string} projectIdOrKey - Project key or ID
     * @param {Object} options - Optional parameters
     * @returns {Promise<Object>} Project details
     */
    async getProject(projectIdOrKey, options = {}) {
        const params = {};
        if (options.expand) params.expand = options.expand;
        if (options.properties) params.properties = options.properties;
        
        return await this.makeRequest('GET', `/rest/api/3/project/${projectIdOrKey}`, null, params);
    }

    /**
     * Get boards associated with a project
     * @param {string} projectKeyOrId - Project key or ID to filter boards
     * @param {Object} options - Optional parameters
     * @returns {Promise<Array>} List of boards
     */
    async getProjectBoards(projectKeyOrId, options = {}) {
        const params = {
            projectKeyOrId: projectKeyOrId
        };
        
        if (options.type) params.type = options.type;
        if (options.startAt !== undefined) params.startAt = options.startAt;
        if (options.maxResults !== undefined) params.maxResults = options.maxResults;
        
        try {
            // Try Agile API endpoint first (most common for Jira Cloud with Agile enabled)
            const response = await this.makeRequest('GET', '/rest/agile/1.0/board', null, params);
            return response.values || response;
        } catch (error) {
            // If Agile API fails, try the Core API endpoint (some instances may have it)
            if (error.response?.status === 404 || error.response?.status === 403) {
                try {
                    console.warn(`Agile API endpoint not available, trying Core API endpoint for boards`);
                    const response = await this.makeRequest('GET', '/rest/api/3/board', null, params);
                    return response.values || response;
                } catch (coreError) {
                    // If both endpoints fail, return empty array with warning
                    console.warn(`Could not fetch boards for project ${projectKeyOrId}: ${coreError.message}`);
                    return [];
                }
            } else {
                // Other errors (network, auth, etc.) - rethrow
                throw error;
            }
        }
    }

    /**
     * Get workflow schemes associated with a project
     * @param {string} projectIdOrKey - Project key or ID
     * @returns {Promise<Array>} List of workflow scheme IDs associated with the project
     */
    async getProjectWorkflowSchemes(projectIdOrKey) {
        try {
            // Get project to get its ID
            const project = await this.getProject(projectIdOrKey);
            const projectId = project.id;
            
            // Get workflow scheme project associations
            const response = await this.makeRequest('GET', '/rest/api/3/workflowscheme/project', null, {
                projectId: projectId
            });
            
            // The response contains a values array of workflow scheme associations
            // Each association has a workflowScheme object with an id
            if (response && response.values && Array.isArray(response.values)) {
                const schemeIds = response.values.map(association => association.workflowScheme?.id).filter(id => id);
                return schemeIds;
            }
            
            return [];
        } catch (error) {
            // If the endpoint returns 404 or other error, the project might be using Default Workflow Scheme
            // or the endpoint might not be available
            console.warn(`Could not fetch workflow scheme associations for project ${projectIdOrKey}: ${error.message}`);
            return [];
        }
    }

    /**
     * Search for workflows by name
     * @param {string} workflowName - Workflow name to search for
     * @param {boolean} isActive - Whether to search active workflows only
     * @returns {Promise<Array>} List of matching workflows
     */
    async searchWorkflowsByName(workflowName, isActive = true) {
        const params = {
            workflowName: workflowName,
            isActive: isActive
        };
        
        try {
            const response = await this.makeRequest('GET', '/rest/api/3/workflow/search', null, params);
            return response.values || response;
        } catch (error) {
            console.warn(`Could not search workflows by name "${workflowName}": ${error.message}`);
            return [];
        }
    }

    /**
     * Get workflows for a project
     * @param {string} projectIdOrKey - Project key or ID
     * @returns {Promise<Array>} List of workflows
     */
    async getProjectWorkflows(projectIdOrKey) {
        // First get the project to get its ID
        const project = await this.getProject(projectIdOrKey);
        
        // Get workflow schemes associated with the project
        const workflowSchemeIds = await this.getProjectWorkflowSchemes(projectIdOrKey);
        
        // If no workflow schemes are returned from the project associations endpoint,
        // try to get the project's workflow scheme directly from project details
        if (workflowSchemeIds.length === 0) {
            try {
                // Get project details with workflow scheme expansion
                const projectDetails = await this.getProject(projectIdOrKey, { expand: 'workflowScheme' });
                
                if (projectDetails.workflowScheme && projectDetails.workflowScheme.id) {
                    // Project has a workflow scheme (could be default or custom)
                    workflowSchemeIds.push(projectDetails.workflowScheme.id);
                } else {
                    // No workflow scheme found at all
                    console.warn(`No workflow scheme found for project ${projectIdOrKey}.`);
                    return [];
                }
            } catch (error) {
                console.warn(`Could not fetch project details with workflow scheme for ${projectIdOrKey}: ${error.message}`);
                return [];
            }
        }
        
        // Collect all workflows from all associated workflow schemes
        const allWorkflows = [];
        
        for (const schemeId of workflowSchemeIds) {
            try {
                // Get workflow scheme details
                const scheme = await this.getWorkflowScheme(schemeId);
                
                // Extract workflow names from the scheme
                const workflowNames = [];
                
                // Check for default workflow
                if (scheme.defaultWorkflow) {
                    // Keep the brackets - workflow names include brackets
                    workflowNames.push(scheme.defaultWorkflow);
                }
                
                // Check for issue type mappings
                if (scheme.issueTypeMappings) {
                    // issueTypeMappings maps issue type IDs to workflow names
                    const mappingWorkflows = Object.values(scheme.issueTypeMappings)
                        .filter(w => w);
                    workflowNames.push(...mappingWorkflows);
                }
                
                // Remove duplicates
                const uniqueWorkflowNames = [...new Set(workflowNames.filter(name => name))];
                
                // Search for workflows by name
                for (const workflowName of uniqueWorkflowNames) {
                    try {
                        const matchingWorkflows = await this.searchWorkflowsByName(workflowName, true);
                        
                        if (matchingWorkflows && matchingWorkflows.length > 0) {
                            // Add the matching workflows directly - they already contain the necessary information
                            allWorkflows.push(...matchingWorkflows);
                        } else {
                            console.warn(`No workflow found with name "${workflowName}" for project ${projectIdOrKey}`);
                        }
                    } catch (searchError) {
                        console.warn(`Could not search for workflow "${workflowName}": ${searchError.message}`);
                    }
                }
            } catch (schemeError) {
                console.warn(`Could not fetch workflow scheme ${schemeId} for project ${projectIdOrKey}: ${schemeError.message}`);
            }
        }
        
        // Return unique workflows (in case same workflow is in multiple schemes)
        const uniqueWorkflows = [];
        const seenWorkflowIds = new Set();
        
        for (const workflow of allWorkflows) {
            const workflowId = workflow.id || workflow.entityId || workflow.key;
            if (workflowId && !seenWorkflowIds.has(workflowId)) {
                seenWorkflowIds.add(workflowId);
                uniqueWorkflows.push(workflow);
            }
        }
        
        return uniqueWorkflows;
    }

    /**
     * List workflows (active or inactive)
     * @param {boolean} isActive - Whether to list active workflows (true) or inactive (false)
     * @returns {Promise<Array>} List of workflows
     */
    async listWorkflows(isActive = true) {
        const params = {
            workflowName: '',
            isActive: isActive
        };
        
        try {
            const response = await this.makeRequest('GET', '/rest/api/3/workflow/search', null, params);
            return response.values || response;
        } catch (error) {
            console.warn(`Could not fetch workflows: ${error.message}`);
            return [];
        }
    }

    /**
     * Get workflow details including statuses and transitions
     * @param {string} workflowId - Workflow ID
     * @param {Object} options - Optional parameters
     * @returns {Promise<Object>} Workflow details
     */
    async getWorkflow(workflowId, options = {}) {
        const params = {};
        if (options.workflowName) params.workflowName = options.workflowName;
        if (options.expand) params.expand = options.expand;
        
        return await this.makeRequest('GET', `/rest/api/3/workflow/${workflowId}`, null, params);
    }

    /**
     * Get all statuses in the Jira instance
     * @returns {Promise<Array>} List of all status objects with id, name, description, etc.
     */
    async getAllStatuses() {
        // Check cache first
        if (this.allStatusesCache && this.allStatusesCache.timestamp + this.cacheTTL > Date.now()) {
            return this.allStatusesCache.data;
        }
        
        try {
            const response = await this.makeRequest('GET', '/rest/api/3/status');
            // Cache the result
            this.allStatusesCache = {
                data: response || [],
                timestamp: Date.now()
            };
            return this.allStatusesCache.data;
        } catch (error) {
            console.warn(`Could not fetch all statuses: ${error.message}`);
            return [];
        }
    }

    /**
     * Get workflow statuses with caching
     * @param {string} workflowId - Workflow ID (entityId/UUID)
     * @returns {Promise<Array>} List of status objects with id, name, description, etc.
     */
    async getWorkflowStatuses(workflowId) {
        // Check cache first
        const cacheKey = `workflow-${workflowId}`;
        const cached = this.workflowStatusesCache.get(cacheKey);
        
        if (cached && cached.timestamp + this.cacheTTL > Date.now()) {
            return cached.data;
        }
        
        try {
            const response = await this.makeRequest('GET', `/rest/api/3/workflow/${workflowId}/statuses`);
            const statuses = response || [];
            
            // Cache the result
            this.workflowStatusesCache.set(cacheKey, {
                data: statuses,
                timestamp: Date.now()
            });
            
            return statuses;
        } catch (error) {
            console.warn(`Could not fetch statuses for workflow ${workflowId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get workflow scheme details
     * @param {string} schemeId - Workflow scheme ID
     * @param {Object} options - Optional parameters
     * @returns {Promise<Object>} Workflow scheme details
     */
    async getWorkflowScheme(schemeId, options = {}) {
        const params = {};
        if (options.returnDraftIfExists !== undefined) params.returnDraftIfExists = options.returnDraftIfExists;
        
        return await this.makeRequest('GET', `/rest/api/3/workflowscheme/${schemeId}`, null, params);
    }

    /**
     * Get status details by ID or name
     * @param {string} idOrName - Status ID or name
     * @returns {Promise<Object>} Status details
     */
    async getStatus(idOrName) {
        return await this.makeRequest('GET', `/rest/api/3/status/${idOrName}`);
    }

    /**
     * Search for a status within project workflows
     * @param {string} projectIdOrKey - Project key or ID
     * @param {string} statusIdentifier - Status name or ID to search for
     * @returns {Promise<Object>} Found status with workflow context
     */
    async findStatusInProject(projectIdOrKey, statusIdentifier) {
        // Get project workflows
        const workflows = await this.getProjectWorkflows(projectIdOrKey);
        
        if (workflows.length === 0) {
            throw new Error(`No workflows found for project ${projectIdOrKey}`);
        }

        // Search through each workflow for the status
        for (const workflow of workflows) {
            try {
                // Get workflow details with statuses and transitions
                const workflowDetails = await this.getWorkflow(workflow.id, { expand: 'transitions' });
                
                if (workflowDetails.statuses) {
                    // Search for status by name or ID
                    const foundStatus = workflowDetails.statuses.find(status =>
                        status.name.toLowerCase() === statusIdentifier.toLowerCase() ||
                        status.id === statusIdentifier
                    );
                    
                    if (foundStatus) {
                        return {
                            status: foundStatus,
                            workflow: {
                                id: workflow.id,
                                name: workflow.name,
                                details: workflowDetails
                            },
                            project: projectIdOrKey
                        };
                    }
                }
            } catch (error) {
                // If we can't get workflow details, skip to next workflow
                console.warn(`Could not get details for workflow ${workflow.id}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error(`Status '${statusIdentifier}' not found in any workflow for project ${projectIdOrKey}`);
    }

    /**
     * Get transitions from a specific status in a project workflow
     * @param {string} projectIdOrKey - Project key or ID
     * @param {string} statusIdentifier - Status name or ID
     * @returns {Promise<Array>} List of transitions from the status
     */
    async getStatusTransitions(projectIdOrKey, statusIdentifier) {
        // Find the status in project workflows
        const statusResult = await this.findStatusInProject(projectIdOrKey, statusIdentifier);
        const { status, workflow } = statusResult;
        
        // Get transitions from the workflow that originate from this status
        const transitions = [];
        
        if (workflow.details.transitions) {
            for (const transition of workflow.details.transitions) {
                // Check if transition originates from our status
                if (transition.from && transition.from.length > 0) {
                    const fromStatus = transition.from.find(from =>
                        from.id === status.id || from.name.toLowerCase() === status.name.toLowerCase()
                    );
                    
                    if (fromStatus) {
                        transitions.push({
                            id: transition.id,
                            name: transition.name,
                            to: transition.to,
                            type: transition.type,
                            screen: transition.screen,
                            rules: transition.rules,
                            properties: transition.properties
                        });
                    }
                }
            }
        }
        
        return {
            status: status,
            workflow: {
                id: workflow.id,
                name: workflow.name
            },
            transitions: transitions,
            project: projectIdOrKey
        };
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

    /**
     * List all screen schemes
     * @returns {Promise<Array>} List of screen schemes
     */
    async listScreenSchemes() {
        try {
            const response = await this.makeRequest('GET', '/rest/api/3/screenscheme');
            return response.values || response;
        } catch (error) {
            console.warn(`Could not fetch screen schemes: ${error.message}`);
            return [];
        }
    }

    /**
     * Delete screen schemes
     * @param {Array<string>} schemeIds - Array of screen scheme IDs to delete
     * @returns {Promise<Array>} Results of deletion operations
     */
    async deleteScreenSchemes(schemeIds) {
        const results = [];
        for (const schemeId of schemeIds) {
            try {
                await this.rateLimitHandler.handleWithRetry(
                    () => this.makeRequest('DELETE', `/rest/api/3/screenscheme/${schemeId}`),
                    `deleteScreenScheme-${schemeId}`
                );
                results.push({ id: schemeId, success: true });
            } catch (error) {
                const errorMsg = getErrorMessage(error);
                results.push({ id: schemeId, success: false, error: errorMsg });
            }
        }
        return results;
    }

    /**
     * Get unused screen schemes (not associated with any project)
     * @returns {Promise<Array>} List of unused screen schemes
     */
    async getUnusedScreenSchemes() {
        try {
            const allSchemes = await this.listScreenSchemes();
            const unusedSchemes = [];
            
            // For each scheme, check if it has projects
            for (const scheme of allSchemes) {
                if (scheme.projects?.total === 0 || !scheme.projects) {
                    unusedSchemes.push(scheme);
                }
            }
            
            return unusedSchemes;
        } catch (error) {
            console.warn(`Could not fetch unused screen schemes: ${error.message}`);
            return [];
        }
    }

    /**
     * Get field configuration scheme projects (paginated list)
     * @param {Object} options - Query parameters
     * @param {number} options.startAt - Start at index (default: 0)
     * @param {number} options.maxResults - Maximum results (default: 50)
     * @param {string|Array<string|number>} options.projectId - Filter by project IDs or keys (string or array)
     * @returns {Promise<Object>} PageBeanFieldConfigurationSchemeProjects response
     */
    async getFieldConfigurationSchemeProjects(options = {}) {
        const params = {};
        if (options.startAt !== undefined) params.startAt = options.startAt;
        if (options.maxResults !== undefined) params.maxResults = options.maxResults;
        
        // Handle project IDs/keys - convert keys to IDs if needed
        if (options.projectId) {
            // Convert to array if it's a string
            const projectIdentifiers = Array.isArray(options.projectId) ? options.projectId : [options.projectId];
            const projectIds = [];
            const invalidProjects = [];
            
            for (const projectIdentifier of projectIdentifiers) {
                // Check if it's a numeric ID
                if (typeof projectIdentifier === 'number' || /^\d+$/.test(projectIdentifier)) {
                    projectIds.push(projectIdentifier);
                } else {
                    // It's a project key, need to get the ID
                    try {
                        const project = await this.getProject(projectIdentifier);
                        projectIds.push(project.id);
                    } catch (error) {
                        console.warn(`Could not find project with key ${projectIdentifier}: ${error.message}`);
                        invalidProjects.push(projectIdentifier);
                        // Skip this project
                    }
                }
            }
            
            if (projectIds.length === 0) {
                // No valid projects found
                if (invalidProjects.length > 0) {
                    throw new Error(`No valid projects found. Could not resolve project keys: ${invalidProjects.join(', ')}`);
                }
                // Return empty result instead of calling API with empty projectId parameter
                return {
                    isLast: true,
                    maxResults: options.maxResults || 50,
                    startAt: options.startAt || 0,
                    total: 0,
                    values: []
                };
            }
            
            params.projectId = projectIds.join(',');
        }

        try {
            const response = await this.makeRequest('GET', '/rest/api/3/fieldconfigurationscheme/project', null, params);
            return response;
        } catch (error) {
            console.warn(`Could not fetch field configuration scheme projects: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assign field configuration scheme to project(s)
     * @param {string|Array<string|number>} projectIdentifier - Project ID, key, or array of project IDs/keys
     * @param {string} fieldConfigurationSchemeId - Field configuration scheme ID (null for default)
     * @returns {Promise<Array>} Results of assignment operations
     */
    async assignFieldConfigurationScheme(projectIdentifier, fieldConfigurationSchemeId) {
        // Handle single project or array of projects
        const projectIdentifiers = Array.isArray(projectIdentifier) ? projectIdentifier : [projectIdentifier];
        
        const results = [];
        for (const identifier of projectIdentifiers) {
            try {
                // Convert project key to ID if needed
                let projectId;
                if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
                    projectId = identifier;
                } else {
                    // It's a project key, need to get the ID
                    const project = await this.getProject(identifier);
                    projectId = project.id;
                }
                
                const data = {
                    projectId: projectId,
                    fieldConfigurationSchemeId: fieldConfigurationSchemeId
                };

                await this.rateLimitHandler.handleWithRetry(
                    () => this.makeRequest('PUT', '/rest/api/3/fieldconfigurationscheme/project', data),
                    `assignFieldConfigScheme-${identifier}`
                );
                
                results.push({ identifier, projectId, success: true });
            } catch (error) {
                const errorMsg = getErrorMessage(error);
                results.push({ identifier, success: false, error: errorMsg });
            }
        }
        
        return results;
    }

    /**
     * List all field configuration schemes
     * @returns {Promise<Array>} List of field configuration schemes
     */
    async listFieldConfigurationSchemes() {
        try {
            const response = await this.makeRequest('GET', '/rest/api/3/fieldconfigurationscheme');
            return response.values || response;
        } catch (error) {
            console.warn(`Could not fetch field configuration schemes: ${error.message}`);
            return [];
        }
    }

    /**
     * Get field configuration schemes by project category
     * @param {string} categoryId - Project category ID
     * @returns {Promise<Array>} List of field configuration schemes with projects in the category
     */
    async getFieldConfigurationSchemesByCategory(categoryId) {
        try {
            // First get all projects in the category
            const projects = await this.listProjectsByCategory(categoryId);
            if (projects.length === 0) {
                return [];
            }

            // Get project IDs
            const projectIds = projects.map(p => p.id);
            
            // Get field configuration scheme projects for these project IDs
            const response = await this.getFieldConfigurationSchemeProjects({ projectId: projectIds });
            
            // Extract unique schemes from the response
            const schemesMap = new Map();
            if (response.values && Array.isArray(response.values)) {
                response.values.forEach(item => {
                    if (item.fieldConfigurationScheme) {
                        const schemeId = item.fieldConfigurationScheme.id;
                        if (!schemesMap.has(schemeId)) {
                            schemesMap.set(schemeId, {
                                ...item.fieldConfigurationScheme,
                                projectIds: item.projectIds || []
                            });
                        }
                    }
                });
            }
            
            return Array.from(schemesMap.values());
        } catch (error) {
            console.warn(`Could not fetch field configuration schemes by category: ${error.message}`);
            return [];
        }
    }

    /**
     * Assign field configuration scheme to all projects in a category
     * @param {string} categoryId - Project category ID
     * @param {string} fieldConfigurationSchemeId - Field configuration scheme ID (null for default)
     * @returns {Promise<Array>} Results of assignment operations
     */
    async assignFieldConfigurationSchemeToCategory(categoryId, fieldConfigurationSchemeId) {
        try {
            // Get all projects in the category
            const projects = await this.listProjectsByCategory(categoryId);
            if (projects.length === 0) {
                return [];
            }

            const results = [];
            for (const project of projects) {
                try {
                    await this.rateLimitHandler.handleWithRetry(
                        () => this.assignFieldConfigurationScheme(project.id, fieldConfigurationSchemeId),
                        `assignFieldConfigScheme-${project.id}`
                    );
                    results.push({ projectId: project.id, projectKey: project.key, success: true });
                } catch (error) {
                    const errorMsg = getErrorMessage(error);
                    results.push({ projectId: project.id, projectKey: project.key, success: false, error: errorMsg });
                }
            }
            return results;
        } catch (error) {
            console.warn(`Could not assign field configuration scheme to category: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    /**
     * Get screen schemes by project category
     * @param {string} categoryId - Project category ID
     * @returns {Promise<Array>} List of screen schemes with projects in the category
     */
    async getScreenSchemesByCategory(categoryId) {
        try {
            // First get all projects in the category
            const projects = await this.listProjectsByCategory(categoryId);
            if (projects.length === 0) {
                return [];
            }

            // Get all screen schemes
            const allSchemes = await this.listScreenSchemes();
            
            // Filter schemes that have projects in our category
            // Note: This is a simplified implementation - in reality we'd need to check
            // which projects each screen scheme is associated with via issue type screen schemes
            const schemesInCategory = [];
            
            for (const scheme of allSchemes) {
                // Check if scheme has projects property
                if (scheme.projects && scheme.projects.total > 0) {
                    // We would need to check if any of these projects are in our category
                    // For now, we'll return all schemes with projects
                    schemesInCategory.push(scheme);
                }
            }
            
            return schemesInCategory;
        } catch (error) {
            console.warn(`Could not fetch screen schemes by category: ${error.message}`);
            return [];
        }
    }

    /**
     * Assign screen scheme to all projects in a category
     * @param {string} categoryId - Project category ID
     * @param {string} screenSchemeId - Screen scheme ID
     * @returns {Promise<Array>} Results of assignment operations
     */
    async assignScreenSchemeToCategory(categoryId, screenSchemeId) {
        try {
            // Get all projects in the category
            const projects = await this.listProjectsByCategory(categoryId);
            if (projects.length === 0) {
                return [];
            }

            const results = [];
            for (const project of projects) {
                try {
                    // Note: Jira API doesn't have a direct endpoint to assign screen scheme to project
                    // Screen schemes are assigned via issue type screen schemes
                    // This would need to be implemented differently
                    // For now, we'll log a warning and return success=false
                    results.push({
                        projectId: project.id,
                        projectKey: project.key,
                        success: false,
                        error: 'Screen scheme assignment via category not implemented yet'
                    });
                } catch (error) {
                    const errorMsg = getErrorMessage(error);
                    results.push({ projectId: project.id, projectKey: project.key, success: false, error: errorMsg });
                }
            }
            return results;
        } catch (error) {
            console.warn(`Could not assign screen scheme to category: ${getErrorMessage(error)}`);
            throw error;
        }
    }
}

module.exports = JiraApi;