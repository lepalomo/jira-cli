const axios = require('axios');

class JiraApi {
    constructor(url, email, token) {
        this.url = url;
        this.auth = Buffer.from(`${email}:${token}`).toString('base64');
    }

    async listProjects() {
        let allProjects = [];
        let startAt = 0;
        const maxResults = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await axios.get(`${this.url}/rest/api/3/project/search`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    expand: 'insight,projectCategory,lead',
                    status: 'live',
                    orderBy: '-lastIssueUpdatedTime',
                    startAt: startAt,
                    maxResults: maxResults
                }
            });
            
            allProjects = allProjects.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async archiveProject(projectKey) {
        await axios.put(`${this.url}/rest/api/3/project/${projectKey}/archive`, {}, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
    }

    async updateProject(projectKey, updates) {
        const response = await axios.put(`${this.url}/rest/api/3/project/${projectKey}`, updates, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }

    async updateProjectCategory(projectKey, categoryId) {
        const response = await axios.put(`${this.url}/rest/api/3/project/${projectKey}`, {
            categoryId: parseInt(categoryId)
        }, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }

    async listCategories() {
        const response = await axios.get(`${this.url}/rest/api/3/projectCategory`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
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
            const response = await axios.get(`${this.url}/rest/api/3/project/search`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    expand: 'insight,projectCategory,lead',
                    status: 'live',
                    categoryId: categoryId,
                    orderBy: '-lastIssueUpdatedTime',
                    startAt: startAt,
                    maxResults: maxResults
                }
            });
            
            allProjects = allProjects.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allProjects;
    }

    async deleteProject(projectKey) {
        await axios.delete(`${this.url}/rest/api/3/project/${projectKey}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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
            const response = await axios.get(`${this.url}/rest/api/3/workflow/${workflowId}/workflowSchemes`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    ...(nextPageToken && { nextPageToken }),
                    maxResults: 50
                }
            });
            
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
            const response = await axios.get(`${this.url}/rest/api/3/workflows/search`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    startAt: startAt,
                    maxResults: maxResults,
                    isActive: isActive
                }
            });
            
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
        await axios.delete(`${this.url}/rest/api/3/workflow/${workflowName}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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

    async listWorkflowSchemes() {
        let allSchemes = [];
        let startAt = 0;
        const maxResults = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await axios.get(`${this.url}/rest/api/3/workflowscheme`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    startAt: startAt,
                    maxResults: maxResults
                }
            });
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        // Verificar quais esquemas estão ativos (associados a projetos)
        let activeSchemeIds = new Set();
        let projectStartAt = 0;
        const projectMaxResults = 100;
        let hasMoreProjects = true;

        while (hasMoreProjects) {
            const projectsResponse = await axios.get(`${this.url}/rest/api/3/project/search`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: {
                    expand: 'workflowScheme',
                    startAt: projectStartAt,
                    maxResults: projectMaxResults
                }
            });

            const projects = projectsResponse.data.values;
            projects.forEach(project => {
                const schemeId = project.workflowScheme?.id;
                if (schemeId) {
                    activeSchemeIds.add(schemeId);
                }
            });

            hasMoreProjects = !projectsResponse.data.isLast;
            projectStartAt += projectMaxResults;
        }
        
        return allSchemes.map(scheme => ({
            ...scheme,
            isActive: activeSchemeIds.has(scheme.id)
        }));
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
        const allSchemes = await this.listWorkflowSchemes();
        return allSchemes.filter(scheme => !scheme.isActive);
    }

    async deleteWorkflowScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/workflowscheme/${schemeId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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
                maxResults: maxResults
            };

            // Add optional parameters if provided
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/issuetypescreenscheme`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: params
            });
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteIssueTypeScreenScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/issuetypescreenscheme/${schemeId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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
                maxResults: maxResults
            };

            // Add optional parameters if provided
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/issuetypescheme`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: params
            });
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteIssueTypeScheme(schemeId) {
        await axios.delete(`${this.url}/rest/api/3/issuetypescheme/${schemeId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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

            const response = await axios.get(`${this.url}/rest/api/3/issuetype`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: params
            });
            
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
                maxResults: maxResults
            };

            // Add optional parameters if provided
            if (options.id) params.id = options.id;
            if (options.queryString) params.queryString = options.queryString;
            if (options.orderBy) params.orderBy = options.orderBy;
            if (options.expand) params.expand = options.expand;

            const response = await axios.get(`${this.url}/rest/api/3/screenscheme`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: params
            });
            
            allSchemes = allSchemes.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allSchemes;
    }

    async deleteScreenScheme(screenSchemeId) {
        await axios.delete(`${this.url}/rest/api/3/screenscheme/${screenSchemeId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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
        await axios.delete(`${this.url}/rest/api/3/issuetype/${issueTypeId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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

            const response = await axios.get(`${this.url}/rest/api/3/screens`, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Accept': 'application/json'
                },
                params: params
            });
            
            allScreens = allScreens.concat(response.data.values);
            hasMore = !response.data.isLast;
            startAt += maxResults;
        }
        
        return allScreens;
    }

    async deleteScreen(screenId) {
        await axios.delete(`${this.url}/rest/api/3/screens/${screenId}`, {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Accept': 'application/json'
            }
        });
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