const axios = require('axios');

class JiraApi {
    constructor(url, email, token) {
        this.url = url;
        this.auth = Buffer.from(`${email}:${token}`).toString('base64');
        this.timeout = 120000; // 120 seconds timeout
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
        let allIssueTypes = [];
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

            const response = await axios.get(`${this.url}/rest/api/3/issuetype`, this.createAxiosConfig({
                params: params
            }));
            
            allIssueTypes = allIssueTypes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allIssueTypes;
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
        let allScreens = [];
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

            const response = await axios.get(`${this.url}/rest/api/3/screens`, this.createAxiosConfig({
                params: params
            }));
            
            allScreens = allScreens.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allScreens;
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
}

module.exports = JiraApi;