const Table = require('cli-table3');

function createProjectsTable(projects) {
    const table = new Table({
        head: ['Project Name', 'Key', 'Category', 'Responsible', 'Last Activity'],
        colWidths: [25, 10, 15, 40, 25]
    });

    projects.forEach(project => {
        const lastActivity = project.insight && project.insight.lastIssueUpdateTime
            ? new Date(project.insight.lastIssueUpdateTime).toLocaleString('pt-BR')
            : 'Sem atividade';

        const lead = project.lead
            ? project.lead.displayName
            : 'Sem responsável';

        table.push([
            project.name || 'N/A',
            project.key || 'N/A',
            project.projectCategory ? project.projectCategory.name : 'Sem categoria',
            lead,
            lastActivity
        ]);
    });

    return table.toString();
}

function createWorkflowsTable(workflows) {
    const table = new Table({
        head: ['ID', 'Nome', 'Escopo', 'Workflow Schemes'],
        colWidths: [40, 70, 15, 80]
    });

    workflows.forEach(workflow => {
        const schemes = workflow.schemeNames && workflow.schemeNames.length > 0
            ? workflow.schemeNames.join(', ')
            : 'Nenhum';

        table.push([
            workflow.id || 'N/A',
            workflow.name || 'N/A',
            workflow.scope?.type || 'N/A',
            schemes
        ]);
    });

    return table.toString();
}

function createWorkflowSchemesTable(schemes) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição'],
        colWidths: [10, 50, 70]
    });

    schemes.forEach(scheme => {
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'Sem descrição'
        ]);
    });

    return table.toString();
}

function createIssueTypeScreenSchemesTable(schemes) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição', 'Projetos'],
        colWidths: [10, 30, 40, 20]
    });

    schemes.forEach(scheme => {
        const projectCount = scheme.projects?.total || 0;
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'Sem descrição',
            projectCount.toString()
        ]);
    });

    return table.toString();
}

function createIssueTypeSchemesTable(schemes) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição', 'Projetos', 'Tipos de Issue'],
        colWidths: [10, 30, 35, 15, 20]
    });

    schemes.forEach(scheme => {
        const projectCount = scheme.projects?.total || 0;
        const issueTypeCount = scheme.issueTypes?.total || 0;
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'Sem descrição',
            projectCount.toString(),
            issueTypeCount.toString()
        ]);
    });

    return table.toString();
}

function createIssueTypesTable(issueTypes) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição', 'Subtarefa', 'Ícone'],
        colWidths: [10, 30, 40, 12, 20]
    });

    issueTypes.forEach(issueType => {
        table.push([
            issueType.id || 'N/A',
            issueType.name || 'N/A',
            issueType.description || 'Sem descrição',
            issueType.subtask ? 'Sim' : 'Não',
            issueType.iconUrl || 'N/A'
        ]);
    });

    return table.toString();
}

function createScreenSchemesTable(schemes) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição', 'Issue Type Screen Schemes'],
        colWidths: [10, 45, 40, 30]
    });

    schemes.forEach(scheme => {
        // Try to get project count first, fall back to issue type screen scheme count
        let count = 0;
        if (scheme.projects?.total !== undefined) {
            count = scheme.projects.total;
        } else if (scheme.issueTypeScreenSchemes?.total !== undefined) {
            count = scheme.issueTypeScreenSchemes.total;
        }

        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'Sem descrição',
            count.toString()
        ]);
    });

    return table.toString();
}

function createScreensTable(screens) {
    const table = new Table({
        head: ['ID', 'Nome', 'Descrição'],
        colWidths: [10, 40, 50]
    });

    screens.forEach(screen => {
        table.push([
            screen.id || 'N/A',
            screen.name || 'N/A',
            screen.description || 'Sem descrição'
        ]);
    });

    return table.toString();
}

function createFieldsTable(fields) {
    const table = new Table({
        head: ['ID', 'Name', 'Type', 'Description', 'Screens', 'Contexts', 'Last Used'],
        colWidths: [20, 30, 10, 80, 12, 12, 15]
    });

    fields.forEach(field => {
        // Determine field type (custom or system)
        const fieldType = field.schema?.custom ? 'custom' : 'system';

        // Format description (truncate if too long, show empty string if no description)
        let description = field.description || '';
        let truncatedDesc = '';
        if (description) {
            truncatedDesc = description.length > 80 ? description.substring(0, 77) + '...' : description;
        }

        // Get screens count - handle different possible property names
        let screensCount = '0';
        if (field.screensCount !== undefined && field.screensCount !== null) {
            screensCount = field.screensCount.toString();
        } else if (field.screens !== undefined && field.screens !== null) {
            // If screens is an array, use length
            if (Array.isArray(field.screens)) {
                screensCount = field.screens.length.toString();
            } else if (typeof field.screens === 'number') {
                screensCount = field.screens.toString();
            }
        }

        // Get contexts count - handle different possible property names
        let contextsCount = '0';
        if (field.contextsCount !== undefined && field.contextsCount !== null) {
            contextsCount = field.contextsCount.toString();
        } else if (field.contexts !== undefined && field.contexts !== null) {
            // If contexts is an array, use length
            if (Array.isArray(field.contexts)) {
                contextsCount = field.contexts.length.toString();
            } else if (typeof field.contexts === 'number') {
                contextsCount = field.contexts.toString();
            }
        }

        // Format last used date - handle TRACKED/NOT_TRACKED/NO_INFORMATION types
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
                    // TRACKED type but no value
                    lastUsed = 'Never';
                }
            }
        }

        table.push([
            field.id || 'N/A',
            field.name || 'N/A',
            fieldType,
            truncatedDesc,
            screensCount,
            contextsCount,
            lastUsed
        ]);
    });

    return table.toString();
}

function createIssuesTable(issues) {
    const table = new Table({
        head: ['Key', 'Summary', 'Type', 'Status', 'Priority', 'Assignee', 'Created', 'Updated'],
        colWidths: [12, 50, 15, 15, 12, 25, 20, 20]
    });

    issues.forEach(issue => {
        const key = issue.key || 'N/A';
        const summary = issue.fields?.summary || 'No summary';
        const issueType = issue.fields?.issuetype?.name || 'N/A';
        const status = issue.fields?.status?.name || 'N/A';
        const priority = issue.fields?.priority?.name || 'N/A';
        const assignee = issue.fields?.assignee?.displayName || 'Unassigned';
        
        // Format dates
        let created = 'N/A';
        let updated = 'N/A';
        if (issue.fields?.created) {
            try {
                created = new Date(issue.fields.created).toLocaleDateString('en-US');
            } catch (e) {
                created = issue.fields.created;
            }
        }
        if (issue.fields?.updated) {
            try {
                updated = new Date(issue.fields.updated).toLocaleDateString('en-US');
            } catch (e) {
                updated = issue.fields.updated;
            }
        }

        // Truncate summary if too long
        const truncatedSummary = summary.length > 50 ? summary.substring(0, 47) + '...' : summary;

        table.push([
            key,
            truncatedSummary,
            issueType,
            status,
            priority,
            assignee,
            created,
            updated
        ]);
    });

    return table.toString();
}

function createIssueDetailTable(issue) {
    const table = new Table({
        head: ['Field', 'Value'],
        colWidths: [30, 70]
    });

    // Add basic issue information
    table.push(['Key', issue.key || 'N/A']);
    table.push(['ID', issue.id || 'N/A']);
    table.push(['Self', issue.self || 'N/A']);
    
    // Add fields from the issue
    if (issue.fields) {
        // Common fields to display
        const commonFields = [
            { key: 'summary', label: 'Summary' },
            { key: 'description', label: 'Description' },
            { key: 'issuetype', label: 'Issue Type', transform: (val) => val?.name || 'N/A' },
            { key: 'status', label: 'Status', transform: (val) => val?.name || 'N/A' },
            { key: 'priority', label: 'Priority', transform: (val) => val?.name || 'N/A' },
            { key: 'assignee', label: 'Assignee', transform: (val) => val?.displayName || 'Unassigned' },
            { key: 'reporter', label: 'Reporter', transform: (val) => val?.displayName || 'N/A' },
            { key: 'created', label: 'Created', transform: (val) => val ? new Date(val).toLocaleString('en-US') : 'N/A' },
            { key: 'updated', label: 'Updated', transform: (val) => val ? new Date(val).toLocaleString('en-US') : 'N/A' },
            { key: 'resolution', label: 'Resolution', transform: (val) => val?.name || 'Unresolved' },
            { key: 'resolutiondate', label: 'Resolution Date', transform: (val) => val ? new Date(val).toLocaleString('en-US') : 'N/A' },
            { key: 'duedate', label: 'Due Date', transform: (val) => val || 'N/A' },
            { key: 'project', label: 'Project', transform: (val) => val?.name || 'N/A' }
        ];

        commonFields.forEach(field => {
            const value = issue.fields[field.key];
            let displayValue;
            
            if (field.transform) {
                displayValue = field.transform(value);
            } else if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
            } else if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else {
                displayValue = value.toString();
            }
            
            // Truncate long values
            if (displayValue.length > 100) {
                displayValue = displayValue.substring(0, 97) + '...';
            }
            
            table.push([field.label, displayValue]);
        });
    }

    return table.toString();
}

module.exports = {
    createProjectsTable,
    createWorkflowsTable,
    createWorkflowSchemesTable,
    createIssueTypeScreenSchemesTable,
    createIssueTypeSchemesTable,
    createIssueTypesTable,
    createScreenSchemesTable,
    createScreensTable,
    createFieldsTable,
    createIssuesTable,
    createIssueDetailTable
};