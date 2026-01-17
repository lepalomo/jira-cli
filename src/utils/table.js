const Table = require('cli-table3');
const { extractTextFromDoc } = require('./docExtractor');

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

/**
 * Create a table for workflow schemes with project associations
 * @param {Array} schemes - Array of workflow scheme objects with project associations
 * @returns {string} Formatted table string
 */
function createProjectWorkflowSchemesTable(schemes) {
    const table = new Table({
        head: ['Scheme ID', 'Name', 'Description', 'Default Workflow', 'Project IDs'],
        colWidths: [15, 30, 40, 25, 20]
    });

    schemes.forEach(scheme => {
        // Extract default workflow - could be a string or object
        let defaultWorkflow = 'None';
        if (scheme.defaultWorkflow) {
            if (typeof scheme.defaultWorkflow === 'string') {
                defaultWorkflow = scheme.defaultWorkflow;
            } else if (scheme.defaultWorkflow.name) {
                defaultWorkflow = scheme.defaultWorkflow.name;
            } else if (scheme.defaultWorkflow.id) {
                defaultWorkflow = scheme.defaultWorkflow.id;
            }
        }

        // Format project IDs - could be array of IDs or objects
        let projectIds = 'None';
        if (scheme.projectIds && Array.isArray(scheme.projectIds)) {
            if (scheme.projectIds.length > 0) {
                // Take first few IDs to avoid overflowing column
                const displayIds = scheme.projectIds.slice(0, 3).map(id =>
                    typeof id === 'object' ? id.id || id.key || 'N/A' : id
                );
                projectIds = displayIds.join(', ');
                if (scheme.projectIds.length > 3) {
                    projectIds += `, +${scheme.projectIds.length - 3}`;
                }
            }
        } else if (scheme.projects && Array.isArray(scheme.projects)) {
            // Alternative property name
            const ids = scheme.projects.map(p => p.id || p.key).filter(Boolean);
            if (ids.length > 0) {
                const displayIds = ids.slice(0, 3);
                projectIds = displayIds.join(', ');
                if (ids.length > 3) {
                    projectIds += `, +${ids.length - 3}`;
                }
            }
        } else if (scheme.projectAssociations && Array.isArray(scheme.projectAssociations)) {
            // From workflow scheme project associations endpoint
            const ids = scheme.projectAssociations.map(a => a.projectId).filter(Boolean);
            if (ids.length > 0) {
                const displayIds = ids.slice(0, 3);
                projectIds = displayIds.join(', ');
                if (ids.length > 3) {
                    projectIds += `, +${ids.length - 3}`;
                }
            }
        }

        // Truncate description if too long
        let description = scheme.description || 'No description';
        if (description.length > 37) {
            description = description.substring(0, 34) + '...';
        }

        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            description,
            defaultWorkflow,
            projectIds
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

/**
 * Determine the type of a Jira field based on field ID, value, and schema information
 * @param {string} fieldId - The field ID (e.g., 'summary', 'customfield_12345')
 * @param {*} value - The field value
 * @param {Object} schema - Optional field schema information
 * @returns {string} Field type description
 */
function getFieldType(fieldId, value, schema = null) {
    // Handle empty or invalid field IDs
    if (!fieldId || typeof fieldId !== 'string' || fieldId.trim() === '') {
        return 'Unknown';
    }
    
    // Check if it's a custom field
    if (fieldId.startsWith('customfield_')) {
        // Try to determine custom field type from schema
        if (schema) {
            if (schema.custom && typeof schema.custom === 'string') {
                // Extract custom field type from schema.custom
                // Handle different formats: with or without prefix
                let customType = schema.custom;
                if (customType.includes(':')) {
                    // Extract the part after the last colon
                    const parts = customType.split(':');
                    customType = parts[parts.length - 1];
                }
                
                // Map common custom field types to readable names
                const typeMap = {
                    'textfield': 'Text Field',
                    'textarea': 'Text Area',
                    'select': 'Select List',
                    'multiselect': 'Multi-Select',
                    'radiobuttons': 'Radio Buttons',
                    'multicheckboxes': 'Multi-Checkboxes',
                    'datepicker': 'Date Picker',
                    'datetime': 'Date Time',
                    'userpicker': 'User Picker',
                    'grouppicker': 'Group Picker',
                    'projectpicker': 'Project Picker',
                    'versionpicker': 'Version Picker',
                    'labels': 'Labels',
                    'url': 'URL',
                    'float': 'Number',
                    'number': 'Number'
                };
                
                // Return mapped type or the custom type itself
                return typeMap[customType] || customType;
            }
            if (schema.type && typeof schema.type === 'string') {
                // System field types from schema
                const systemTypeMap = {
                    'string': 'String',
                    'number': 'Number',
                    'date': 'Date',
                    'datetime': 'Date Time',
                    'user': 'User',
                    'array': 'Array',
                    'any': 'Any',
                    'option': 'Option',
                    'option-with-child': 'Option with Child'
                };
                return systemTypeMap[schema.type] || schema.type;
            }
        }
        
        // If no schema, try to infer from value type
        if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    return 'Array';
                }
                if (value.type === 'doc') {
                    return 'ADF Document';
                }
                if (value.displayName !== undefined) {
                    return 'User';
                }
                if (value.name !== undefined) {
                    return 'Named Object';
                }
                if (value.value !== undefined) {
                    return 'Option';
                }
                return 'Object';
            }
            if (typeof value === 'string') {
                // Check if it's a date string (YYYY-MM-DD format)
                // More strict validation: must be valid date and not include time
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    // Validate it's a real date (not like 2024-13-45)
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        // Check if the parsed date matches the input (to catch invalid dates like 2024-02-31)
                        const [year, month, day] = value.split('-').map(Number);
                        if (date.getFullYear() === year &&
                            date.getMonth() + 1 === month &&
                            date.getDate() === day) {
                            return 'Date';
                        }
                    }
                }
                // Check for ISO datetime strings (with T or space)
                if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(value)) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        return 'Date Time';
                    }
                }
                return 'String';
            }
            if (typeof value === 'number') {
                return 'Number';
            }
            if (typeof value === 'boolean') {
                return 'Boolean';
            }
        }
        
        return 'Custom Field';
    }
    
    // System fields - map known field IDs to types
    const systemFieldTypes = {
        // Basic fields
        'key': 'Issue Key',
        'id': 'ID',
        'self': 'URL',
        
        // Common issue fields
        'summary': 'String',
        'description': 'ADF Document',
        'issuetype': 'Issue Type',
        'status': 'Status',
        'priority': 'Priority',
        'assignee': 'User',
        'reporter': 'User',
        'creator': 'User',
        'created': 'Date Time',
        'updated': 'Date Time',
        'resolution': 'Resolution',
        'resolutiondate': 'Date Time',
        'duedate': 'Date',
        'project': 'Project',
        
        // Other system fields
        'labels': 'Array',
        'components': 'Array',
        'fixVersions': 'Array',
        'affectsVersions': 'Array',
        'environment': 'ADF Document',
        'comment': 'Comments',
        'worklog': 'Work Logs',
        'attachment': 'Attachments',
        'subtasks': 'Array',
        'issuelinks': 'Array',
        'watches': 'Watches',
        'timeestimate': 'Number',
        'timeoriginalestimate': 'Number',
        'timespent': 'Number',
        'aggregatetimespent': 'Number',
        'aggregatetimeestimate': 'Number',
        'aggregatetimeoriginalestimate': 'Number',
        'progress': 'Progress',
        'votes': 'Votes',
        'workratio': 'Number',
        'lastViewed': 'Date Time',
        'parent': 'Parent Issue'
    };
    
    // Return mapped type or infer from value
    if (systemFieldTypes[fieldId]) {
        return systemFieldTypes[fieldId];
    }
    
    // Infer from value if not mapped
    if (value !== null && value !== undefined) {
        const valueType = typeof value;
        if (valueType === 'object') {
            if (Array.isArray(value)) {
                return 'Array';
            }
            if (value.type === 'doc') {
                return 'ADF Document';
            }
            return 'Object';
        }
        return valueType.charAt(0).toUpperCase() + valueType.slice(1);
    }
    
    return 'Unknown';
}

function createIssueDetailTable(issue, requestedFields = null) {
    const table = new Table({
        head: ['FieldID', 'Field', 'Type', 'Value'],
        colWidths: [20, 25, 20, 120]
    });

    // Add basic issue information
    const keyType = getFieldType('key', issue.key);
    const idType = getFieldType('id', issue.id);
    const selfType = getFieldType('self', issue.self);
    
    table.push(['key', 'Key', keyType.length > 20 ? keyType.substring(0, 17) + '...' : keyType, issue.key || 'N/A']);
    table.push(['id', 'ID', idType.length > 20 ? idType.substring(0, 17) + '...' : idType, issue.id || 'N/A']);
    table.push(['self', 'Self', selfType.length > 20 ? selfType.substring(0, 17) + '...' : selfType, issue.self || 'N/A']);

    // Track which fields we've already displayed
    const displayedFields = new Set(['key', 'id', 'self']);

    // Parse requestedFields if provided as string
    let requestedFieldsSet = null;
    if (requestedFields) {
        if (typeof requestedFields === 'string') {
            requestedFieldsSet = new Set(requestedFields.split(',').map(f => f.trim()));
        } else if (Array.isArray(requestedFields)) {
            requestedFieldsSet = new Set(requestedFields);
        }
    }

    // Add fields from the issue
    if (issue.fields) {
        // Common fields to display with nice labels
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

        // Display common fields first
        commonFields.forEach(field => {
            const value = issue.fields[field.key];
            let displayValue;

            if (field.transform) {
                displayValue = field.transform(value);
            } else if (typeof value === 'object' && value !== null) {
                // Check if it's a doc type structure
                if (value.type === 'doc') {
                    displayValue = extractTextFromDoc(value);
                } else {
                    displayValue = JSON.stringify(value);
                }
            } else if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else {
                displayValue = value.toString();
            }

            // Truncate long values (up to 120 chars to match column width)
            if (displayValue.length > 120) {
                displayValue = displayValue.substring(0, 117) + '...';
            }

            // Get field type and truncate if too long for column (20 chars)
            const fieldType = getFieldType(field.key, value);
            const displayType = fieldType.length > 20 ? fieldType.substring(0, 17) + '...' : fieldType;
            
            table.push([field.key, field.label, displayType, displayValue]);
            displayedFields.add(field.key);
        });

        // Define default field keys (key, id, self + common fields)
        const defaultFieldKeys = new Set([
            'key', 'id', 'self',
            ...commonFields.map(f => f.key)
        ]);

        // Now display any other fields that weren't in the common fields list
        // Sort keys alphabetically for consistent output
        const allFieldKeys = Object.keys(issue.fields).sort();

        allFieldKeys.forEach(fieldKey => {
            // Skip if we've already displayed this field
            if (displayedFields.has(fieldKey)) {
                return;
            }

            // Determine if this is a custom field
            const isCustomField = fieldKey.startsWith('customfield_');

            // Determine if we should show this field based on requested fields
            let shouldShow = false;

            if (requestedFieldsSet === null) {
                // No fields requested: only show default fields
                shouldShow = defaultFieldKeys.has(fieldKey);
            } else {
                // Fields requested: show default fields OR requested fields
                shouldShow = defaultFieldKeys.has(fieldKey) || requestedFieldsSet.has(fieldKey);
            }

            if (!shouldShow) {
                return;
            }

            const value = issue.fields[fieldKey];
            let displayValue;

            // Format the value appropriately
            if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else if (typeof value === 'object') {
                // Handle complex objects
                if (value.name !== undefined) {
                    // For objects with a name property (like user, component, etc.)
                    displayValue = value.name;
                } else if (value.displayName !== undefined) {
                    // For user objects with displayName
                    displayValue = value.displayName;
                } else if (value.value !== undefined) {
                    // For objects with a value property (like select list options)
                    displayValue = value.value;
                } else if (Array.isArray(value)) {
                    // For arrays, show count and first few items
                    if (value.length === 0) {
                        displayValue = 'Empty';
                    } else if (value.length <= 3) {
                        // For small arrays, show all items
                        displayValue = value.map(item => {
                            if (typeof item === 'object') {
                                return item.name || item.displayName || item.value || JSON.stringify(item);
                            }
                            return item.toString();
                        }).join(', ');
                    } else {
                        // For large arrays, show count
                        displayValue = `${value.length} items`;
                    }
                } else if (value.type === 'doc') {
                    // Handle Jira document structure
                    displayValue = extractTextFromDoc(value);
                } else {
                    // Fallback to JSON string
                    displayValue = JSON.stringify(value);
                }
            } else {
                // For primitive values
                displayValue = value.toString();
            }

            // Truncate long values (up to 120 chars to match column width)
            if (displayValue.length > 120) {
                displayValue = displayValue.substring(0, 117) + '...';
            }

            // For custom fields (starting with customfield_), use the field ID as label
            // For other fields, use a capitalized version of the key
            let fieldLabel = fieldKey;
            if (isCustomField) {
                fieldLabel = `Custom Field (${fieldKey})`;
            } else {
                // Capitalize first letter and replace underscores with spaces
                fieldLabel = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' ');
            }

            // Get field type and truncate if too long for column (20 chars)
            const fieldType = getFieldType(fieldKey, value);
            const displayType = fieldType.length > 20 ? fieldType.substring(0, 17) + '...' : fieldType;
            
            table.push([fieldKey, fieldLabel, displayType, displayValue]);
        });
    }

    return table.toString();
}

/**
 * Create a detailed table for project information
 * @param {Object} project - Project details object
 * @param {Array} boards - List of boards associated with the project
 * @param {Array} workflows - List of workflows associated with the project
 * @param {Array} workflowSchemes - List of workflow schemes associated with the project
 * @param {Array} workflowStatuses - List of workflow statuses with workflowName, statusId, statusName
 * @returns {string} Formatted table string
 */
function createProjectDetailsTable(project, boards = [], workflows = [], workflowSchemes = [], workflowStatuses = []) {
    // Main project details table
    const mainTable = new Table({
        head: ['Property', 'Value'],
        colWidths: [30, 80]
    });

    // Add basic project information
    mainTable.push(['Project Name', project.name || 'N/A']);
    mainTable.push(['Project Key', project.key || 'N/A']);
    mainTable.push(['Project ID', project.id || 'N/A']);
    mainTable.push(['Project Type', project.projectTypeKey || 'N/A']);
    mainTable.push(['Archived', project.archived ? 'Yes' : 'No']);
    mainTable.push(['Simplified', project.simplified ? 'Yes' : 'No']);
    
    // Add project lead/responsible
    const lead = project.lead ? `${project.lead.displayName} (${project.lead.emailAddress || 'N/A'})` : 'No lead';
    mainTable.push(['Responsible', lead]);
    
    // Add project category
    const category = project.projectCategory ? `${project.projectCategory.name} (ID: ${project.projectCategory.id})` : 'No category';
    mainTable.push(['Category', category]);
    
    // Add URLs
    mainTable.push(['Self URL', project.self || 'N/A']);
    if (project.url) mainTable.push(['Project URL', project.url]);
    
    // Add description if available
    if (project.description) {
        const desc = project.description.length > 70 ? project.description.substring(0, 67) + '...' : project.description;
        mainTable.push(['Description', desc]);
    }
    
    // Add insight data if available
    if (project.insight) {
        const lastActivity = project.insight.lastIssueUpdateTime
            ? new Date(project.insight.lastIssueUpdateTime).toLocaleString('en-US')
            : 'No activity';
        mainTable.push(['Last Activity', lastActivity]);
        
        if (project.insight.totalIssueCount !== undefined) {
            mainTable.push(['Total Issues', project.insight.totalIssueCount.toString()]);
        }
    }
    
    let output = 'PROJECT DETAILS\n';
    output += '='.repeat(50) + '\n';
    output += mainTable.toString() + '\n\n';
    
    // Boards table if available
    if (boards.length > 0) {
        const boardsTable = new Table({
            head: ['Board ID', 'Name', 'Type', 'Filter ID'],
            colWidths: [15, 40, 15, 20]
        });
        
        boards.forEach(board => {
            boardsTable.push([
                board.id || 'N/A',
                board.name || 'N/A',
                board.type || 'N/A',
                board.filterId || 'N/A'
            ]);
        });
        
        output += `ASSOCIATED BOARDS (${boards.length})\n`;
        output += '='.repeat(50) + '\n';
        output += boardsTable.toString() + '\n\n';
    } else {
        output += 'No boards associated with this project.\n\n';
    }
    
    // Workflow Schemes table if available (displayed before workflows table)
    if (workflowSchemes.length > 0) {
        output += `WORKFLOW SCHEMES (${workflowSchemes.length})\n`;
        output += '='.repeat(50) + '\n';
        output += createProjectWorkflowSchemesTable(workflowSchemes) + '\n\n';
    }
    
    // Workflows table if available
    if (workflows.length > 0) {
        const workflowsTable = new Table({
            head: ['Workflow ID', 'Name', 'Description'],
            colWidths: [45, 40, 50]
        });
        
        workflows.forEach(workflow => {
            // Extract workflow ID - handle nested structure where id is an object
            let workflowId = 'N/A';
            if (workflow.id) {
                if (typeof workflow.id === 'string') {
                    workflowId = workflow.id;
                } else if (workflow.id.entityId) {
                    workflowId = workflow.id.entityId;
                } else if (workflow.id.id) {
                    workflowId = workflow.id.id;
                } else if (workflow.id.key) {
                    workflowId = workflow.id.key;
                }
            } else if (workflow.entityId) {
                workflowId = workflow.entityId;
            } else if (workflow.workflowId) {
                workflowId = workflow.workflowId;
            } else if (workflow.key) {
                workflowId = workflow.key;
            }
            
            // Extract workflow name - handle nested structure
            let workflowName = 'N/A';
            if (workflow.id && workflow.id.name) {
                workflowName = workflow.id.name;
            } else if (workflow.name) {
                workflowName = workflow.name;
            } else if (workflow.displayName) {
                workflowName = workflow.displayName;
            } else if (workflow.workflowName) {
                workflowName = workflow.workflowName;
            } else if (workflow.id && workflow.id.displayName) {
                workflowName = workflow.id.displayName;
            }
            
            // Extract description
            let workflowDescription = 'No description';
            if (workflow.description) {
                if (typeof workflow.description === 'string' && workflow.description.trim() !== '') {
                    workflowDescription = workflow.description;
                } else if (workflow.description.text) {
                    workflowDescription = workflow.description.text;
                } else if (workflow.description.value) {
                    workflowDescription = workflow.description.value;
                }
            }
            
            workflowsTable.push([
                workflowId,
                workflowName,
                workflowDescription
            ]);
        });
        
        output += `ASSOCIATED WORKFLOWS (${workflows.length})\n`;
        output += '='.repeat(50) + '\n';
        output += workflowsTable.toString() + '\n';
    } else {
        output += 'No workflows found for this project.\n';
    }
    
    // Workflow Statuses table if available
    if (workflowStatuses && workflowStatuses.length > 0) {
        output += '\n' + createWorkflowStatusesTable(workflowStatuses) + '\n';
    }
    
    return output;
}

/**
 * Create a table for status transitions
 * @param {Object} statusResult - Result from getStatusTransitions
 * @returns {string} Formatted table string
 */
function createStatusTransitionsTable(statusResult) {
    const { status, workflow, transitions, project } = statusResult;
    
    let output = `STATUS TRANSITIONS FOR "${status.name}" (ID: ${status.id})\n`;
    output += `Project: ${project} | Workflow: ${workflow.name} (ID: ${workflow.id})\n`;
    output += '='.repeat(80) + '\n\n';
    
    // Status details table
    const statusTable = new Table({
        head: ['Property', 'Value'],
        colWidths: [20, 60]
    });
    
    statusTable.push(['Status Name', status.name || 'N/A']);
    statusTable.push(['Status ID', status.id || 'N/A']);
    statusTable.push(['Status Description', status.description || 'No description']);
    statusTable.push(['Status Category', status.statusCategory?.name || 'N/A']);
    statusTable.push(['Status Category Key', status.statusCategory?.key || 'N/A']);
    statusTable.push(['Status Category Color', status.statusCategory?.colorName || 'N/A']);
    
    output += 'STATUS DETAILS:\n';
    output += statusTable.toString() + '\n\n';
    
    // Transitions table
    if (transitions.length > 0) {
        const transitionsTable = new Table({
            head: ['Transition ID', 'Name', 'To Status', 'Type', 'Screen', 'Has Rules', 'Properties'],
            colWidths: [15, 25, 20, 15, 15, 10, 30]
        });
        
        transitions.forEach(transition => {
            const toStatusName = transition.to?.name || 'N/A';
            const toStatusId = transition.to?.id || 'N/A';
            const toStatus = `${toStatusName} (${toStatusId})`;
            const hasRules = transition.rules ? 'Yes' : 'No';
            const propertiesCount = transition.properties ? Object.keys(transition.properties).length : 0;
            const screenName = transition.screen?.name || 'None';
            
            transitionsTable.push([
                transition.id || 'N/A',
                transition.name || 'N/A',
                toStatus,
                transition.type || 'N/A',
                screenName,
                hasRules,
                `${propertiesCount} properties`
            ]);
        });
        
        output += `TRANSITIONS FROM THIS STATUS (${transitions.length}):\n`;
        output += transitionsTable.toString() + '\n\n';
        
        // Detailed transition information
        output += 'DETAILED TRANSITION INFORMATION:\n';
        output += '='.repeat(80) + '\n';
        
        transitions.forEach((transition, index) => {
            output += `\n${index + 1}. ${transition.name} (ID: ${transition.id})\n`;
            output += '-'.repeat(40) + '\n';
            
            if (transition.to) {
                output += `  To Status: ${transition.to.name} (ID: ${transition.to.id})\n`;
                if (transition.to.description) {
                    output += `  To Description: ${transition.to.description}\n`;
                }
            }
            
            output += `  Type: ${transition.type || 'N/A'}\n`;
            
            if (transition.screen) {
                output += `  Screen: ${transition.screen.name} (ID: ${transition.screen.id})\n`;
            } else {
                output += `  Screen: None\n`;
            }
            
            if (transition.rules) {
                const ruleTypes = [];
                if (transition.rules.conditions) ruleTypes.push('Conditions');
                if (transition.rules.validators) ruleTypes.push('Validators');
                if (transition.rules.postFunctions) ruleTypes.push('Post Functions');
                output += `  Rules: ${ruleTypes.join(', ')}\n`;
            }
            
            if (transition.properties && Object.keys(transition.properties).length > 0) {
                output += `  Properties: ${Object.keys(transition.properties).length} properties defined\n`;
                // Show first few properties
                const propKeys = Object.keys(transition.properties);
                for (let i = 0; i < Math.min(3, propKeys.length); i++) {
                    const key = propKeys[i];
                    const value = transition.properties[key];
                    output += `    - ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
                }
                if (propKeys.length > 3) {
                    output += `    ... and ${propKeys.length - 3} more properties\n`;
                }
            }
        });
    } else {
        output += 'No transitions available from this status.\n';
        output += 'This status may be a final status in the workflow.\n';
    }
    
    return output;
}

/**
 * Create a table for workflow statuses
 * @param {Array} workflowStatuses - Array of workflow status objects with workflowName, statusId, statusName
 * @returns {string} Formatted table string
 */
function createWorkflowStatusesTable(workflowStatuses) {
    if (!workflowStatuses || workflowStatuses.length === 0) {
        return 'No workflow statuses found.';
    }

    const table = new Table({
        head: ['Workflow Name', 'Status ID', 'Status Name'],
        colWidths: [30, 20, 30]
    });

    // Sort by workflow name, then by status name
    const sortedStatuses = [...workflowStatuses].sort((a, b) => {
        const workflowCompare = (a.workflowName || '').localeCompare(b.workflowName || '');
        if (workflowCompare !== 0) return workflowCompare;
        return (a.statusName || '').localeCompare(b.statusName || '');
    });

    sortedStatuses.forEach(status => {
        table.push([
            status.workflowName || 'N/A',
            status.statusId || 'N/A',
            status.statusName || 'N/A'
        ]);
    });

    let output = 'WORKFLOW STATUSES\n';
    output += '='.repeat(50) + '\n';
    output += table.toString();
    
    return output;
}

/**
 * Create a table for field configuration schemes
 * @param {Array} schemes - Array of field configuration scheme objects
 * @returns {string} Formatted table string
 */
function createFieldConfigurationSchemesTable(schemes) {
    if (!schemes || schemes.length === 0) {
        return 'No field configuration schemes found.';
    }

    const table = new Table({
        head: ['Scheme ID', 'Name', 'Description', 'Project IDs'],
        colWidths: [15, 30, 40, 25]
    });

    schemes.forEach(scheme => {
        // Handle different response structures:
        // 1. From /rest/api/3/fieldconfigurationscheme/project endpoint:
        //    { fieldConfigurationScheme: { id, name, description }, projectIds: [...] }
        // 2. From /rest/api/3/fieldconfigurationscheme endpoint:
        //    { id, name, description } (direct scheme object)
        
        let schemeId, schemeName, schemeDescription, projectIds;
        
        if (scheme.fieldConfigurationScheme) {
            // Structure 1: Nested fieldConfigurationScheme object
            schemeId = scheme.fieldConfigurationScheme.id;
            schemeName = scheme.fieldConfigurationScheme.name;
            schemeDescription = scheme.fieldConfigurationScheme.description;
            projectIds = scheme.projectIds || [];
        } else {
            // Structure 2: Direct scheme object
            schemeId = scheme.id;
            schemeName = scheme.name;
            schemeDescription = scheme.description;
            projectIds = scheme.projectIds || [];
        }
        
        // Handle default scheme (id might be null or undefined)
        if (!schemeId || schemeId === 'default') {
            schemeId = 'default';
            if (!schemeName) schemeName = 'Default Scheme';
            if (!schemeDescription) schemeDescription = 'Default field configuration scheme';
        }
        
        let projectIdsDisplay = 'None';
        if (projectIds.length > 0) {
            const displayIds = projectIds.slice(0, 3);
            projectIdsDisplay = displayIds.join(', ');
            if (projectIds.length > 3) {
                projectIdsDisplay += `, +${projectIds.length - 3}`;
            }
        }

        table.push([
            schemeId,
            schemeName || 'N/A',
            schemeDescription || 'No description',
            projectIdsDisplay
        ]);
    });

    return table.toString();
}

/**
 * Create a table for field configuration schemes by category
 * @param {Array} schemes - Array of field configuration scheme objects with project count
 * @returns {string} Formatted table string
 */
function createFieldConfigurationSchemesByCategoryTable(schemes) {
    if (!schemes || schemes.length === 0) {
        return 'No field configuration schemes found.';
    }

    const table = new Table({
        head: ['Scheme ID', 'Name', 'Description', 'Project Count'],
        colWidths: [15, 30, 40, 15]
    });

    schemes.forEach(scheme => {
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'No description',
            scheme.projectCount || '0'
        ]);
    });

    return table.toString();
}

/**
 * Create a table for screen schemes by category
 * @param {Array} schemes - Array of screen scheme objects with project count
 * @returns {string} Formatted table string
 */
function createScreenSchemesByCategoryTable(schemes) {
    if (!schemes || schemes.length === 0) {
        return 'No screen schemes found.';
    }

    const table = new Table({
        head: ['Scheme ID', 'Name', 'Description', 'Project Count'],
        colWidths: [15, 30, 40, 15]
    });

    schemes.forEach(scheme => {
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.description || 'No description',
            scheme.projectCount || '0'
        ]);
    });

    return table.toString();
}

module.exports = {
    createProjectsTable,
    createWorkflowsTable,
    createWorkflowSchemesTable,
    createProjectWorkflowSchemesTable,
    createIssueTypeScreenSchemesTable,
    createIssueTypeSchemesTable,
    createIssueTypesTable,
    createScreenSchemesTable,
    createScreensTable,
    createFieldsTable,
    createIssuesTable,
    createIssueDetailTable,
    createProjectDetailsTable,
    createStatusTransitionsTable,
    createWorkflowStatusesTable,
    createFieldConfigurationSchemesTable,
    createFieldConfigurationSchemesByCategoryTable,
    createScreenSchemesByCategoryTable,
    getFieldType
};