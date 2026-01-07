const axios = require('axios');

class JiraApi {
    constructor(url, email, token) {
        // Normalize URL: ensure it has a protocol
        this.url = this.normalizeUrl(url);
        this.auth = Buffer.from(`${email}:${token}`).toString('base64');
        this.timeout = 120000; // 120 seconds timeout
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

    /**
     * Creates axios configuration with authentication headers and timeout
     * @param {Object} additionalConfig - Additional axios configuration
     * @returns {Object} Axios configuration object
     */
    createAxiosConfig(additionalConfig = {}) {
        return {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json',
                ...(additionalConfig.headers || {})
            },
            timeout: this.timeout,
            ...additionalConfig
        };
    }

    async listProjects(options = {}) {
        let allProjects = [];
        let startAt = 0;
        const maxResults = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await axios.get(`${this.url}/rest/api/3/project/search`, this.createAxiosConfig({
                params: {
                    expand: 'insight,projectCategory,lead',
                    status: options.status || 'live',
                    orderBy: '-lastIssueUpdatedTime',
                    startAt: startAt,
                    maxResults: maxResults
                }
            }));
            
            allProjects = allProjects.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async archiveProject(projectKey) {
        await axios.put(`${this.url}/rest/api/3/project/${projectKey}/archive`, {}, this.createAxiosConfig());
    }

    async updateProject(projectKey, updates) {
        const response = await axios.put(`${this.url}/rest/api/3/project/${projectKey}`, updates, this.createAxiosConfig({
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        return response.data;
    }

    async updateProjectCategory(projectKey, categoryId) {
        const response = await axios.put(`${this.url}/rest/api/3/project/${projectKey}`, {
            categoryId: parseInt(categoryId)
        }, this.createAxiosConfig({
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        return response.data;
    }

    async listCategories() {
        const response = await axios.get(`${this.url}/rest/api/3/projectCategory`, this.createAxiosConfig());
        return response.data;
    }

    async getUnusedProjects() {
        // Archived projects are considered unused
        return await this.listProjects({ status: 'archived' });
    }

    async archiveProjects(projectKeys) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.archiveProject(key);
                results.push({ key, success: true });
            } catch (error) {
                results.push({ key, success: false, error: error.message });
            }
        }
        return results;
    }

    async updateProjectsCategory(projectKeys, categoryId) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.updateProjectCategory(key, categoryId);
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
            const response = await axios.get(`${this.url}/rest/api/3/project/search`, this.createAxiosConfig({
                params: {
                    expand: 'insight,projectCategory,lead',
                    status: 'live',
                    categoryId: categoryId,
                    orderBy: '-lastIssueUpdatedTime',
                    startAt: startAt,
                    maxResults: maxResults
                }
            }));
            
            allProjects = allProjects.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async deleteProject(projectKey) {
        await axios.delete(`${this.url}/rest/api/3/project/${projectKey}`, this.createAxiosConfig());
    }

    async deleteProjects(projectKeys) {
        const results = [];
        for (const key of projectKeys) {
            try {
                await this.deleteProject(key);
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

    async getWorkflowSchemes(workflowId) {
        let allSchemeIds = [];
        let nextPageToken = null;
        
        do {
            const response = await axios.get(`${this.url}/rest/api/3/workflow/${workflowId}/workflowSchemes`, this.createAxiosConfig({
                params: {
                    ...(nextPageToken && { nextPageToken }),
                    maxResults: 50
                }
            }));
            
            if (response.data.workflowSchemes?.values) {
                allSchemeIds = allSchemeIds.concat(
                    response.data.workflowSchemes.values.map(scheme => scheme.id)
                );
            }
            
            nextPageToken = response.data.workflowSchemes?.nextPageToken;
        } while (nextPageToken);
        
        return allSchemeIds;
    }

    async listWorkflows(isActive) {
        let allWorkflows = [];
        let startAt = 0;
        const maxResults = 50;
        let hasMore = true;

        while (hasMore) {
            const response = await axios.get(`${this.url}/rest/api/3/workflows/search`, this.createAxiosConfig({
                params: {
                    startAt: startAt,
                    maxResults: maxResults,
                    isActive: isActive
                }
            }));
            
            allWorkflows = allWorkflows.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        // Buscar todos os workflow schemes
        const allSchemes = await this.listWorkflowSchemes();
        const schemeMap = new Map(allSchemes.map(s => [s.id, s.name]));
        
        // Para cada workflow, buscar os schemes que o usam
        for (const workflow of allWorkflows) {
            const schemeIds = await this.getWorkflowSchemes(workflow.id);
            workflow.schemeNames = schemeIds
                .map(id => schemeMap.get(parseInt(id)))
                .filter(name => name);
        }
        
        return allWorkflows;
    }

    async deleteWorkflow(workflowName) {
        await axios.delete(`${this.url}/rest/api/3/workflow/${workflowName}`, this.createAxiosConfig());
    }

    async deleteWorkflows(workflowIds) {
        const results = [];
        for (const id of workflowIds) {
            try {
                await this.deleteWorkflow(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] || 
                                error.response?.data?.errors || 
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async listWorkflowSchemes(options = {}) {
        let allSchemes = [];
        let startAt = options.startAt || 0;
        const maxResults = options.maxResults || 100;
        let hasMore = true;

        while (hasMore) {
            const params = {
                startAt: startAt,
                maxResults: maxResults
            };

            // Add optional parameters if provided
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/workflowscheme`, this.createAxiosConfig({
                params: params
            }));
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async getInactiveWorkflowsForCleanup() {
        const inactiveWorkflows = await this.listWorkflows(false);
        return inactiveWorkflows.filter(workflow => workflow.schemeNames.length === 0);
    }

    async cleanupInactiveWorkflows() {
        const workflowsToDelete = await this.getInactiveWorkflowsForCleanup();
        if (workflowsToDelete.length === 0) return [];
        
        const workflowIds = workflowsToDelete.map(w => w.id);
        return await this.deleteWorkflows(workflowIds);
    }

    async getInactiveWorkflowSchemesForCleanup() {
        // Note: Jira API doesn't provide isActive status for workflow schemes
        // Without this information, we cannot determine which schemes are inactive
        // Returning empty array to prevent accidental deletion
        return [];
    }

    async getUnusedIssueTypeScreenSchemes() {
        const allSchemes = await this.listIssueTypeScreenSchemes({ expand: 'projects' });
        return allSchemes.filter(scheme => {
            // Check if scheme has no projects linked
            return !scheme.projects || scheme.projects.length === 0;
        });
    }

    async getUnusedIssueTypeSchemes() {
        const allSchemes = await this.listIssueTypeSchemes({ expand: 'projects,issueTypes' });
        return allSchemes.filter(scheme => {
            // Check if scheme has no projects AND no issue types linked
            const hasProjects = scheme.projects && scheme.projects.length > 0;
            const hasIssueTypes = scheme.issueTypes && scheme.issueTypes.length > 0;
            return !hasProjects && !hasIssueTypes;
        });
    }

    async getUnusedScreenSchemes() {
        const allSchemes = await this.listScreenSchemes({ expand: 'issueTypeScreenSchemes' });
        return allSchemes.filter(scheme => {
            // Check if scheme has no issue type screen schemes linked
            return !scheme.issueTypeScreenSchemes || scheme.issueTypeScreenSchemes.length === 0;
        });
    }

    async getUnusedWorkflowSchemes() {
        const allSchemes = await this.listWorkflowSchemes({ expand: 'projects' });
        return allSchemes.filter(scheme => {
            // Check if scheme has no projects linked
            return !scheme.projects || scheme.projects.length === 0;
        });
    }

    async deleteWorkflowScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/workflowscheme/${schemeId}`, this.createAxiosConfig());
    }

    async deleteWorkflowSchemes(schemeIds) {
        const results = [];
        for (const id of schemeIds) {
            try {
                await this.deleteWorkflowScheme(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async cleanupInactiveWorkflowSchemes() {
        const schemesToDelete = await this.getInactiveWorkflowSchemesForCleanup();
        if (schemesToDelete.length === 0) return [];
        
        const schemeIds = schemesToDelete.map(s => s.id);
        return await this.deleteWorkflowSchemes(schemeIds);
    }

    async listIssueTypeScreenSchemes(options = {}) {
        let allSchemes = [];
        let startAt = options.startAt || 0;
        const maxResults = options.maxResults || 100;
        let hasMore = true;

        while (hasMore) {
            const params = {
                startAt: startAt,
                maxResults: maxResults,
                expand: 'projects'
            };

            // Add optional parameters if provided (override expand if specified)
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/issuetypescreenscheme`, this.createAxiosConfig({
                params: params
            }));
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteIssueTypeScreenScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/issuetypescreenscheme/${schemeId}`, this.createAxiosConfig());
    }

    async deleteIssueTypeScreenSchemes(schemeIds) {
        const results = [];
        for (const id of schemeIds) {
            try {
                await this.deleteIssueTypeScreenScheme(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async listIssueTypeSchemes(options = {}) {
        let allSchemes = [];
        let startAt = options.startAt || 0;
        const maxResults = options.maxResults || 100;
        let hasMore = true;

        while (hasMore) {
            const params = {
                startAt: startAt,
                maxResults: maxResults,
                expand: 'projects,issueTypes'
            };

            // Add optional parameters if provided (override expand if specified)
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/issuetypescheme`, this.createAxiosConfig({
                params: params
            }));
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteIssueTypeScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/issuetypescheme/${schemeId}`, this.createAxiosConfig());
    }

    async deleteIssueTypeSchemes(schemeIds) {
        const results = [];
        for (const id of schemeIds) {
            try {
                await this.deleteIssueTypeScheme(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async listIssueTypes(options = {}) {
        const params = {};

        // Add optional parameters if provided
        if (options.id) params.id = options.id;
        if (options.queryString) params.queryString = options.queryString;
        if (options.orderBy) params.orderBy = options.orderBy;
        if (options.expand) params.expand = options.expand;

        const response = await axios.get(`${this.url}/rest/api/3/issuetype`, this.createAxiosConfig({
            params: params
        }));
        
        // The /rest/api/3/issuetype endpoint returns a plain array, not a paginated response
        // Check if response.data is an array (non-paginated) or has values property (paginated)
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data.values && Array.isArray(response.data.values)) {
            // Handle paginated response (though unlikely for this endpoint)
            let allIssueTypes = response.data.values;
            let startAt = response.data.startAt + response.data.maxResults;
            const total = response.data.total;
            
            while (startAt < total) {
                const nextParams = { ...params, startAt: startAt, maxResults: response.data.maxResults };
                const nextResponse = await axios.get(`${this.url}/rest/api/3/issuetype`, this.createAxiosConfig({
                    params: nextParams
                }));
                
                if (Array.isArray(nextResponse.data)) {
                    allIssueTypes = allIssueTypes.concat(nextResponse.data);
                    break;
                } else if (nextResponse.data.values && Array.isArray(nextResponse.data.values)) {
                    allIssueTypes = allIssueTypes.concat(nextResponse.data.values);
                    startAt = nextResponse.data.startAt + nextResponse.data.maxResults;
                } else {
                    break;
                }
            }
            return allIssueTypes;
        }
        
        // Fallback: return empty array
        return [];
    }

    async listScreenSchemes(options = {}) {
        let allSchemes = [];
        let startAt = options.startAt || 0;
        const maxResults = options.maxResults || 100;
        let hasMore = true;

        while (hasMore) {
            const params = {
                startAt: startAt,
                maxResults: maxResults,
                expand: 'issueTypeScreenSchemes'
            };

            // Add optional parameters if provided (override expand if specified)
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/screenscheme`, this.createAxiosConfig({
                params: params
            }));
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteScreenScheme(screenSchemeId) {
        await axios.delete(`${this.url}/rest/api/3/screenscheme/${screenSchemeId}`, this.createAxiosConfig());
    }

    async deleteScreenSchemes(screenSchemeIds) {
        const results = [];
        for (const id of screenSchemeIds) {
            try {
                await this.deleteScreenScheme(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async deleteIssueType(issueTypeId) {
        await axios.delete(`${this.url}/rest/api/3/issuetype/${issueTypeId}`, this.createAxiosConfig());
    }

    async deleteIssueTypes(issueTypeIds) {
        const results = [];
        for (const id of issueTypeIds) {
            try {
                await this.deleteIssueType(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async listScreens(options = {}) {
        const params = {
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 100
        };

        // Add optional parameters if provided
        if (options.id) params.id = options.id;
        if (options.queryString) params.queryString = options.queryString;
        if (options.orderBy) params.orderBy = options.orderBy;
        if (options.expand) params.expand = options.expand;

        const response = await axios.get(`${this.url}/rest/api/3/screens`, this.createAxiosConfig({
            params: params
        }));
        
        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
            // Non-paginated response (plain array)
            return response.data;
        } else if (response.data.values && Array.isArray(response.data.values)) {
            // Paginated response
            let allScreens = response.data.values;
            let startAt = response.data.startAt + response.data.maxResults;
            const total = response.data.total;
            
            while (startAt < total) {
                const nextParams = { ...params, startAt: startAt };
                const nextResponse = await axios.get(`${this.url}/rest/api/3/screens`, this.createAxiosConfig({
                    params: nextParams
                }));
                
                if (Array.isArray(nextResponse.data)) {
                    allScreens = allScreens.concat(nextResponse.data);
                    break;
                } else if (nextResponse.data.values && Array.isArray(nextResponse.data.values)) {
                    allScreens = allScreens.concat(nextResponse.data.values);
                    startAt = nextResponse.data.startAt + nextResponse.data.maxResults;
                } else {
                    break;
                }
            }
            return allScreens;
        }
        
        // Fallback: return empty array
        return [];
    }

    async getScreensByScreenScheme(schemeId) {
        // Fetch the screen scheme with screens expanded
        const schemes = await this.listScreenSchemes({ id: schemeId, expand: 'screens' });
        if (schemes.length === 0) {
            throw new Error(`Screen scheme with ID ${schemeId} not found`);
        }
        
        const scheme = schemes[0];
        if (!scheme.screens) {
            // No screens defined in this scheme
            return [];
        }
        
        // The screens object contains keys like 'default', 'edit', 'view', etc.
        // Extract screen objects from those values
        const screenObjects = Object.values(scheme.screens).filter(screen => screen && screen.id);
        
        // We have screen objects but they might be partial (only id and maybe name).
        // To get full screen details, we could fetch each screen individually,
        // but for consistency with other commands, we'll return the screen objects as-is.
        // Alternatively, we could fetch all screens and filter by IDs.
        // Let's fetch all screens and match by IDs to get full details.
        const allScreens = await this.listScreens();
        const screenIds = screenObjects.map(screen => screen.id);
        return allScreens.filter(screen => screenIds.includes(screen.id));
    }

    async getUnusedScreens() {
        // Fetch all screens
        const allScreens = await this.listScreens();
        let screenSchemes = [];
        try {
            // Try to fetch screen schemes with screens expanded (may not be supported)
            screenSchemes = await this.listScreenSchemes({ expand: 'screens' });
        } catch (error) {
            // If expand 'screens' is not supported, we cannot determine unused screens
            // Log warning and treat all screens as used (return empty array)
            console.warn('Cannot expand screens in screen schemes:', error.response?.data?.errorMessages?.[0] || error.message);
            console.warn('Assuming all screens are used. No screens will be marked as unused.');
            return [];
        }
        
        // Collect screen IDs referenced in screen schemes
        const usedScreenIds = new Set();
        screenSchemes.forEach(scheme => {
            if (scheme.screens) {
                // The screens object may contain fields like 'default', 'edit', 'view', etc.
                Object.values(scheme.screens).forEach(screen => {
                    if (screen && screen.id) {
                        usedScreenIds.add(screen.id);
                    }
                });
            }
        });
        
        // Return screens not referenced
        return allScreens.filter(screen => !usedScreenIds.has(screen.id));
    }

    async deleteScreen(screenId) {
        await axios.delete(`${this.url}/rest/api/3/screens/${screenId}`, this.createAxiosConfig());
    }

    async deleteScreens(screenIds) {
        const results = [];
        for (const id of screenIds) {
            try {
                await this.deleteScreen(id);
                results.push({ id, success: true });
            } catch (error) {
                const errorMsg = error.response?.data?.errorMessages?.[0] ||
                                error.response?.data?.errors ||
                                error.message;
                results.push({ id, success: false, error: errorMsg });
            }
        }
        return results;
    }

    async searchFields(params = {}) {
        let allFields = [];
        let startAt = params.startAt || 0;
        const maxResultsPerPage = params.maxResults || 50;
        const totalLimit = params.maxResults; // Store the original maxResults as total limit
        let hasMore = true;

        while (hasMore) {
            const requestParams = {
                startAt: startAt,
                maxResults: maxResultsPerPage
            };

            // Add optional parameters if provided
            if (params.type) requestParams.type = params.type;
            if (params.id) requestParams.id = params.id;
            if (params.query) requestParams.query = params.query;
            if (params.orderBy) requestParams.orderBy = params.orderBy;
            if (params.expand) requestParams.expand = params.expand;
            if (params.projectIds) requestParams.projectIds = params.projectIds;

            const response = await axios.get(`${this.url}/rest/api/3/field/search`, this.createAxiosConfig({
                params: requestParams
            }));
            
            // Handle paginated response
            if (response.data.values && Array.isArray(response.data.values)) {
                const pageFields = response.data.values;
                
                // If we have a total limit, only take as many as we need
                if (totalLimit && allFields.length + pageFields.length > totalLimit) {
                    const remaining = totalLimit - allFields.length;
                    allFields = allFields.concat(pageFields.slice(0, remaining));
                    hasMore = false;
                } else {
                    allFields = allFields.concat(pageFields);
                    hasMore = !response.data.isLast;
                }
                
                startAt += maxResultsPerPage;
            } else {
                // If response is not paginated as expected, break
                hasMore = false;
                if (Array.isArray(response.data)) {
                    allFields = allFields.concat(response.data);
                }
            }
            
            // Stop if we've reached the total limit
            if (totalLimit && allFields.length >= totalLimit) {
                hasMore = false;
            }
        }
        
        return allFields;
    }

    /**
     * Get a single issue by ID or key
     * @param {string} issueIdOrKey - Issue ID or key (e.g., "PROJ-123" or "10001")
     * @param {Object} options - Additional options
     * @param {string} options.fields - Comma-separated list of fields to include
     * @param {string} options.expand - Comma-separated list of expansions
     * @param {string} options.properties - Comma-separated list of properties to include
     * @returns {Object} Issue data
     */
    async getIssue(issueIdOrKey, options = {}) {
        const params = {};
        
        if (options.fields) params.fields = options.fields;
        if (options.expand) params.expand = options.expand;
        if (options.properties) params.properties = options.properties;
        if (options.updateHistory !== undefined) params.updateHistory = options.updateHistory;

        const response = await axios.get(`${this.url}/rest/api/3/issue/${issueIdOrKey}`, this.createAxiosConfig({
            params: params
        }));
        
        return response.data;
    }

    /**
     * Search issues using JQL
     * @param {string} jql - JQL query string
     * @param {Object} options - Search options
     * @param {string} options.fields - Comma-separated list of fields to include
     * @param {string} options.expand - Comma-separated list of expansions
     * @param {number} options.startAt - Starting index for pagination
     * @param {number} options.maxResults - Maximum number of results to return
     * @param {boolean} options.validateQuery - Whether to validate the JQL query
     * @returns {Object} Search results with issues array
     */
    async searchIssues(jql, options = {}) {
        const requestBody = {
            jql: jql,
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50
        };
        
        if (options.fields) requestBody.fields = options.fields;
        if (options.expand) requestBody.expand = options.expand;
        if (options.validateQuery !== undefined) requestBody.validateQuery = options.validateQuery;

        const response = await axios.post(`${this.url}/rest/api/3/search/jql`,
            requestBody,
            this.createAxiosConfig({
                headers: { 'Content-Type': 'application/json' }
            }));
        
        return response.data;
    }

    /**
     * Get multiple issues in batch
     * @param {Array<string>} issueIdsOrKeys - Array of issue IDs or keys
     * @param {Object} options - Additional options
     * @param {string} options.fields - Comma-separated list of fields to include
     * @param {string} options.expand - Comma-separated list of expansions
     * @returns {Array<Object>} Array of issue data objects
     */
    async getIssuesBatch(issueIdsOrKeys, options = {}) {
        const results = [];
        
        for (const issueIdOrKey of issueIdsOrKeys) {
            try {
                const issue = await this.getIssue(issueIdOrKey, options);
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

    /**
     * Update a single field on an issue
     * @param {string} issueIdOrKey - Issue ID or key
     * @param {string} fieldId - Field ID (e.g., "summary", "description", "customfield_10001")
     * @param {any} value - New value for the field
     * @returns {Object} Update response
     */
    async updateIssueField(issueIdOrKey, fieldId, value) {
        const updateData = {
            fields: {
                [fieldId]: value
            }
        };

        const response = await axios.put(`${this.url}/rest/api/3/issue/${issueIdOrKey}`, updateData, this.createAxiosConfig({
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        
        return response.data;
    }

    /**
     * Update a field on multiple issues in batch
     * @param {Array<string>} issueIdsOrKeys - Array of issue IDs or keys
     * @param {string} fieldId - Field ID to update
     * @param {any} value - New value for the field
     * @returns {Array<Object>} Array of update results
     */
    async updateIssueFieldsBatch(issueIdsOrKeys, fieldId, value) {
        const results = [];
        
        for (const issueIdOrKey of issueIdsOrKeys) {
            try {
                await this.updateIssueField(issueIdOrKey, fieldId, value);
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

    /**
     * Copy field value from one field to another within the same issue
     * @param {string} sourceIssueIdOrKey - Source issue ID or key
     * @param {string} sourceFieldId - Source field ID
     * @param {string} targetFieldId - Target field ID
     * @param {Object} options - Copy options
     * @param {boolean} options.append - Whether to append to existing value (default: false)
     * @param {string} options.separator - Separator to use when appending (default: "\n\n")
     * @returns {Object} Copy operation result
     */
    async copyFieldValue(sourceIssueIdOrKey, sourceFieldId, targetFieldId, options = {}) {
        // Get the source issue to read the field value
        const sourceIssue = await this.getIssue(sourceIssueIdOrKey, {
            fields: `${sourceFieldId},${targetFieldId}`
        });
        
        let sourceValue = sourceIssue.fields?.[sourceFieldId];
        let targetValue = sourceIssue.fields?.[targetFieldId];
        
        // Handle different field types
        if (sourceValue === null || sourceValue === undefined) {
            sourceValue = '';
        }
        
        // Convert to string for text fields
        if (typeof sourceValue === 'object') {
            // For complex fields (like user, date, etc.), we need to handle them appropriately
            // For now, convert to JSON string
            sourceValue = JSON.stringify(sourceValue);
        }
        
        let newValue;
        if (options.append && targetValue) {
            // Append mode
            const separator = options.separator || '\n\n';
            if (typeof targetValue === 'object') {
                // For complex fields, convert to string first
                targetValue = JSON.stringify(targetValue);
            }
            newValue = `${targetValue}${separator}${sourceValue}`;
        } else {
            // Replace mode
            newValue = sourceValue;
        }
        
        // Update the target field
        return await this.updateIssueField(sourceIssueIdOrKey, targetFieldId, newValue);
    }

    /**
     * Copy field values for multiple issues in batch
     * @param {Array<string>} issueIdsOrKeys - Array of issue IDs or keys
     * @param {string} sourceFieldId - Source field ID
     * @param {string} targetFieldId - Target field ID
     * @param {Object} options - Copy options
     * @param {boolean} options.append - Whether to append to existing value
     * @param {string} options.separator - Separator to use when appending
     * @returns {Array<Object>} Array of copy results
     */
    async copyFieldValuesBatch(issueIdsOrKeys, sourceFieldId, targetFieldId, options = {}) {
        const results = [];
        
        for (const issueIdOrKey of issueIdsOrKeys) {
            try {
                await this.copyFieldValue(issueIdOrKey, sourceFieldId, targetFieldId, options);
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
}

module.exports = JiraApi;