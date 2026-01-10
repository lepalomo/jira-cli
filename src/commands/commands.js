const JiraApi = require('../services/jiraApi');
const { createProjectsTable } = require('../utils/table');
const Table = require('cli-table3');
const { applyTimeoutToObject } = require('../utils/timeout');


async function listProjects(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching projects');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const projects = await jira.listProjects();

        loader.stop();

        // Sort by category and then by last activity
        const sortedProjects = projects.sort((a, b) => {
            const categoryA = a.projectCategory?.name || 'No category';
            const categoryB = b.projectCategory?.name || 'No category';

            if (categoryA !== categoryB) {
                return categoryA.localeCompare(categoryB);
            }

            const dateA = a.insight?.lastIssueUpdateTime ? new Date(a.insight.lastIssueUpdateTime) : new Date(0);
            const dateB = b.insight?.lastIssueUpdateTime ? new Date(b.insight.lastIssueUpdateTime) : new Date(0);

            return dateB - dateA; // Most recent first
        });

        console.log(createProjectsTable(sortedProjects));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function listCategories(config) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const categories = await jira.listCategories();

    const table = new Table({
        head: ['ID', 'Name', 'Description'],
        colWidths: [10, 30, 50]
    });

    categories.forEach(category => {
        table.push([
            category.id,
            category.name || 'N/A',
            category.description || 'No description'
        ]);
    });

    console.log(table.toString());
}

async function archiveProjects(config, projectKeys) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.archiveProjects(projectKeys);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Project ${result.key} archived successfully.`);
        } else {
            console.log(`✗ Error archiving project ${result.key}: ${result.error}`);
        }
    });
}

async function updateProjectsCategory(config, projectKeys, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.updateProjectsCategory(projectKeys, categoryId);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Project ${result.key} category changed successfully.`);
        } else {
            console.log(`✗ Error changing project ${result.key} category: ${result.error}`);
        }
    });
}

async function listProjectsByCategory(config, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const projects = await jira.listProjectsByCategory(categoryId);

    // Sort by last activity date (most recent first)
    const sortedProjects = projects.sort((a, b) => {
        const dateA = a.insight?.lastIssueUpdateTime ? new Date(a.insight.lastIssueUpdateTime) : new Date(0);
        const dateB = b.insight?.lastIssueUpdateTime ? new Date(b.insight.lastIssueUpdateTime) : new Date(0);

        return dateB - dateA;
    });

    console.log(createProjectsTable(sortedProjects));
}

async function deleteProjects(config, projectKeys) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.deleteProjects(projectKeys);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Project ${result.key} deleted successfully.`);
        } else {
            console.log(`✗ Error deleting project ${result.key}: ${result.error}`);
        }
    });
}

async function listWorkflows(config, isActive) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching workflows');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const workflows = await jira.listWorkflows(isActive);

        loader.stop();

        // Sort alphabetically by name
        const sortedWorkflows = workflows.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createWorkflowsTable } = require('../utils/table');
        console.log(createWorkflowsTable(sortedWorkflows));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteWorkflows(config, workflowIds, options = {}) {
    const { unused = false, exec = false } = options;
    const jira = new JiraApi(config.url, config.email, config.token);

    if (unused) {
        // Handle unused workflows
        const Loader = require('../utils/loader');
        const loader = new Loader(exec ? 'Searching and deleting unused workflows' : 'Searching unused workflows');
        loader.start();

        try {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                console.log('No unused inactive workflows found.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name'],
                    colWidths: [40, 80]
                });

                workflowsToDelete.forEach(workflow => {
                    table.push([workflow.id || 'N/A', workflow.name || 'N/A']);
                });

                console.log(`\nUnused inactive workflows that would be deleted (${workflowsToDelete.length}):`);
                console.log(table.toString());
                console.log('\nTo execute deletion, add the --exec option');
                return;
            }

            // Execution mode
            console.log(`\n${workflowsToDelete.length} unused inactive workflows will be deleted.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operation cancelled.');
                return;
            }

            const idsToDelete = workflowsToDelete.map(w => w.id);
            const results = await jira.deleteWorkflows(idsToDelete);

            console.log(`\nDeletion results (${results.length} workflows):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow ${result.id} deleted successfully.`
                    : `✗ Error deleting workflow ${result.id}: ${result.error}`;
                console.log(message);
            });
        } catch (error) {
            loader.stop();
            throw error;
        }
    } else {
        // Original behavior: delete specific workflows
        const results = await jira.deleteWorkflows(workflowIds);

        results.forEach(result => {
            if (result.success) {
                console.log(`✓ Workflow ${result.id} deleted successfully.`);
            } else {
                console.log(`✗ Error deleting workflow ${result.id}: ${result.error}`);
            }
        });
    }
}

async function deleteWorkflowSchemes(config, schemeIds, options = {}) {
    const { unused = false, exec = false } = options;
    const jira = new JiraApi(config.url, config.email, config.token);

    if (unused) {
        // Handle unused workflow schemes
        const Loader = require('../utils/loader');
        const loader = new Loader(exec ? 'Searching and deleting unused workflow schemes' : 'Searching unused workflow schemes');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedWorkflowSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('No unused workflow schemes found.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'No description'
                    ]);
                });

                console.log(`\nUnused workflow schemes that would be deleted (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nTo execute deletion, add the --exec option');
                return;
            }

            // Execution mode
            console.log(`\n${schemesToDelete.length} unused workflow schemes will be deleted.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operation cancelled.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteWorkflowSchemes(idsToDelete);

            console.log(`\nDeletion results (${results.length} workflow schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow scheme ${result.id} deleted successfully.`
                    : `✗ Error deleting workflow scheme ${result.id}: ${result.error}`;
                console.log(message);
            });
        } catch (error) {
            loader.stop();
            throw error;
        }
    } else {
        // Original behavior: delete specific schemes
        const results = await jira.deleteWorkflowSchemes(schemeIds);

        results.forEach(result => {
            if (result.success) {
                console.log(`✓ Workflow scheme ${result.id} deleted successfully.`);
            } else {
                console.log(`✗ Error deleting workflow scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listWorkflowSchemes(config) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const schemes = await jira.listWorkflowSchemes();

    // Sort alphabetically by name
    const sortedSchemes = schemes.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
    });

    const { createWorkflowSchemesTable } = require('../utils/table');
    console.log(createWorkflowSchemesTable(sortedSchemes));
}

async function archiveProject(config, projectKey) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.archiveProject(projectKey);
    console.log(`Project ${projectKey} archived successfully.`);
}

async function updateProjectName(config, projectKey, newName) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.updateProject(projectKey, { name: newName });
    console.log(`Project ${projectKey} name changed to: ${newName}`);
}

async function updateProjectCategory(config, projectKey, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.updateProject(projectKey, { projectCategory: { id: categoryId } });
    console.log(`Project ${projectKey} category changed.`);
}

async function cleanupWorkflows(config, execute = false) {
    const Loader = require('../utils/loader');
    const EmailLogger = require('../utils/emailLogger');
    let emailLogger = null;

    if (execute) {
        emailLogger = new EmailLogger(config);
    }

    const loader = new Loader(execute ? 'Executing workflow cleanup' : 'Analyzing workflows for cleanup');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);

        if (execute) {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                const message = 'No inactive workflows without schemes found for cleanup.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflows', message);
                return;
            }

            console.log(`\n${workflowsToDelete.length} inactive workflows will be deleted.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                const message = 'Operation cancelled.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflows - Cancelled', message);
                return;
            }

            const workflowIds = workflowsToDelete.map(w => w.id);
            const results = await jira.deleteWorkflows(workflowIds);

            let logContent = `Cleanup results (${results.length} workflows):\n`;
            console.log(`\nCleanup results (${results.length} workflows):`);
            console.log('='.repeat(60));

            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow ${result.id} deleted successfully.`
                    : `✗ Error deleting workflow ${result.id}: ${result.error}`;
                console.log(message);
                logContent += message + '\n';
            });

            await emailLogger.sendLog('Cleanup Workflows - Executed', logContent);
        } else {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                const message = 'No inactive workflows without schemes found for cleanup.';
                console.log(message);
                return;
            }

            const Table = require('cli-table3');
            const table = new Table({
                head: ['ID', 'Name'],
                colWidths: [40, 80]
            });

            workflowsToDelete.forEach(workflow => {
                table.push([workflow.id || 'N/A', workflow.name || 'N/A']);
            });

            const tableOutput = table.toString();
            console.log(`\nInactive workflows that would be deleted (${workflowsToDelete.length}):`);
            console.log(tableOutput);

            // Versão limpa para email (sem códigos de cor)
            let emailContent = `Inactive workflows that would be deleted (${workflowsToDelete.length}):\n\n`;
            workflowsToDelete.forEach(workflow => {
                emailContent += `ID: ${workflow.id}\nName: ${workflow.name}\n\n`;
            });

            // Email sending removed for preview mode
        }

    } catch (error) {
        loader.stop();
        if (emailLogger) {
            await emailLogger.sendLog('Cleanup Workflows - Erro', `Erro: ${error.message}`);
        }
        throw error;
    }
}

async function cleanupWorkflowSchemes(config, execute = false) {
    const Loader = require('../utils/loader');
    const EmailLogger = require('../utils/emailLogger');
    let emailLogger = null;

    if (execute) {
        emailLogger = new EmailLogger(config);
    }

    const loader = new Loader(execute ? 'Executing cleanup de workflow schemes' : 'Analyzing workflow schemes para limpeza');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);

        if (execute) {
            const schemesToDelete = await jira.getInactiveWorkflowSchemesForCleanup();
            loader.stop();

            if (schemesToDelete.length === 0) {
                const message = 'No inactive workflow schemes found for cleanup.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflow Schemes', message);
                return;
            }

            console.log(`\n${schemesToDelete.length} inactive workflow schemes will be deleted.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                const message = 'Operation cancelled.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflow Schemes - Cancelled', message);
                return;
            }

            const schemeIds = schemesToDelete.map(s => s.id);
            const results = await jira.deleteWorkflowSchemes(schemeIds);

            let logContent = `Cleanup results (${results.length} workflow schemes):\n`;
            console.log(`\nCleanup results (${results.length} workflow schemes):`);
            console.log('='.repeat(60));

            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow scheme ${result.id} deleted successfully.`
                    : `✗ Error deleting workflow scheme ${result.id}: ${result.error}`;
                console.log(message);
                logContent += message + '\n';
            });

            await emailLogger.sendLog('Cleanup Workflow Schemes - Executed', logContent);
        } else {
            const schemesToDelete = await jira.getInactiveWorkflowSchemesForCleanup();
            loader.stop();

            if (schemesToDelete.length === 0) {
                const message = 'No inactive workflow schemes found for cleanup.';
                console.log(message);
                return;
            }

            const Table = require('cli-table3');
            const table = new Table({
                head: ['ID', 'Name', 'Description'],
                colWidths: [30, 40, 50]
            });

            schemesToDelete.forEach(scheme => {
                table.push([
                    scheme.id || 'N/A',
                    scheme.name || 'N/A',
                    scheme.description || 'No description'
                ]);
            });

            const tableOutput = table.toString();
            console.log(`\nWorkflow schemes inativos que seriam excluídos (${schemesToDelete.length}):`);
            console.log(tableOutput);

            let emailContent = `Workflow schemes inativos que seriam excluídos (${schemesToDelete.length}):\n\n`;
            schemesToDelete.forEach(scheme => {
                emailContent += `ID: ${scheme.id}\nName: ${scheme.name}\nDescription: ${scheme.description || 'N/A'}\n\n`;
            });

            // Email sending removed for preview mode
        }

    } catch (error) {
        loader.stop();
        if (emailLogger) {
            await emailLogger.sendLog('Cleanup Workflow Schemes - Erro', `Erro: ${error.message}`);
        }
        throw error;
    }
}

async function listIssueTypeScreenSchemes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching issue type screen schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listIssueTypeScreenSchemes();

        loader.stop();

        // Sort alphabetically by name
        const sortedSchemes = schemes.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createIssueTypeScreenSchemesTable } = require('../utils/table');
        console.log(createIssueTypeScreenSchemesTable(sortedSchemes));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteIssueTypeScreenSchemes(config, schemeIds, options = {}) {
    const { unused = false, exec = false } = options;
    const jira = new JiraApi(config.url, config.email, config.token);

    if (unused) {
        // Handle unused issue type screen schemes
        const Loader = require('../utils/loader');
        const loader = new Loader(exec ? 'Buscando e excluindo issue type screen schemes unuseds' : 'Searching issue type screen schemes unuseds');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedIssueTypeScreenSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('No unused issue type screen schemes found.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'No description'
                    ]);
                });

                console.log(`\nIssue type screen schemes unuseds que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nTo execute deletion, add the --exec option');
                return;
            }

            // Execution mode
            console.log(`\nWill be deleted ${schemesToDelete.length} issue type screen schemes unuseds.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operation cancelled.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteIssueTypeScreenSchemes(idsToDelete);

            console.log(`\nDeletion results (${results.length} issue type screen schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Issue type screen scheme ${result.id} deleted successfully.`
                    : `✗ Error deleting issue type screen scheme ${result.id}: ${result.error}`;
                console.log(message);
            });
        } catch (error) {
            loader.stop();
            throw error;
        }
    } else {
        // Original behavior: delete specific schemes
        const results = await jira.deleteIssueTypeScreenSchemes(schemeIds);

        results.forEach(result => {
            if (result.success) {
                console.log(`✓ Issue type screen scheme ${result.id} deleted successfully.`);
            } else {
                console.log(`✗ Error deleting issue type screen scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listIssueTypeSchemes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching issue type schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listIssueTypeSchemes();

        loader.stop();

        // Sort alphabetically by name
        const sortedSchemes = schemes.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createIssueTypeSchemesTable } = require('../utils/table');
        console.log(createIssueTypeSchemesTable(sortedSchemes));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteIssueTypeSchemes(config, schemeIds, options = {}) {
    const { unused = false, exec = false } = options;
    const jira = new JiraApi(config.url, config.email, config.token);

    if (unused) {
        // Handle unused issue type schemes
        const Loader = require('../utils/loader');
        const loader = new Loader(exec ? 'Buscando e excluindo issue type schemes unuseds' : 'Searching issue type schemes unuseds');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedIssueTypeSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('No unused issue type schemes found.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'No description'
                    ]);
                });

                console.log(`\nIssue type schemes unuseds que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nTo execute deletion, add the --exec option');
                return;
            }

            // Execution mode
            console.log(`\nWill be deleted ${schemesToDelete.length} issue type schemes unuseds.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operation cancelled.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteIssueTypeSchemes(idsToDelete);

            console.log(`\nDeletion results (${results.length} issue type schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Issue type scheme ${result.id} deleted successfully.`
                    : `✗ Error deleting issue type scheme ${result.id}: ${result.error}`;
                console.log(message);
            });
        } catch (error) {
            loader.stop();
            throw error;
        }
    } else {
        // Original behavior: delete specific schemes
        const results = await jira.deleteIssueTypeSchemes(schemeIds);

        results.forEach(result => {
            if (result.success) {
                console.log(`✓ Issue type scheme ${result.id} deleted successfully.`);
            } else {
                console.log(`✗ Error deleting issue type scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listIssueTypes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching issue types');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const issueTypes = await jira.listIssueTypes();

        loader.stop();

        // Sort alphabetically by name
        const sortedIssueTypes = issueTypes.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createIssueTypesTable } = require('../utils/table');
        console.log(createIssueTypesTable(sortedIssueTypes));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteIssueTypes(config, issueTypeIds) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.deleteIssueTypes(issueTypeIds);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Issue type ${result.id} deleted successfully.`);
        } else {
            console.log(`✗ Error deleting issue type ${result.id}: ${result.error}`);
        }
    });
}

async function listScreenSchemes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching screen schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listScreenSchemes();

        loader.stop();

        // Sort alphabetically by name
        const sortedSchemes = schemes.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createScreenSchemesTable } = require('../utils/table');
        console.log(createScreenSchemesTable(sortedSchemes));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteScreenSchemes(config, schemeIds, options = {}) {
    const { unused = false, exec = false } = options;
    const jira = new JiraApi(config.url, config.email, config.token);

    if (unused) {
        // Handle unused screen schemes
        const Loader = require('../utils/loader');
        const loader = new Loader(exec ? 'Buscando e excluindo screen schemes unuseds' : 'Searching screen schemes unuseds');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedScreenSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('No unused screen schemes found.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'No description'
                    ]);
                });

                console.log(`\nScreen schemes unuseds que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nTo execute deletion, add the --exec option');
                return;
            }

            // Execution mode
            console.log(`\nWill be deleted ${schemesToDelete.length} screen schemes unuseds.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirm deletion? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operation cancelled.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteScreenSchemes(idsToDelete);

            console.log(`\nDeletion results (${results.length} screen schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Screen scheme ${result.id} deleted successfully.`
                    : `✗ Error deleting screen scheme ${result.id}: ${result.error}`;
                console.log(message);
            });
        } catch (error) {
            loader.stop();
            throw error;
        }
    } else {
        // Original behavior: delete specific schemes
        const results = await jira.deleteScreenSchemes(schemeIds);

        results.forEach(result => {
            if (result.success) {
                console.log(`✓ Screen scheme ${result.id} deleted successfully.`);
            } else {
                console.log(`✗ Error deleting screen scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listScreens(config, screenSchemeId) {
    const Loader = require('../utils/loader');
    const loader = new Loader(screenSchemeId ? `Searching screens do screen scheme ${screenSchemeId}` : 'Searching screens');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const screens = screenSchemeId
            ? await jira.getScreensByScreenScheme(screenSchemeId)
            : await jira.listScreens();

        loader.stop();

        if (screens.length === 0) {
            console.log(screenSchemeId ? `No screens found in screen scheme ${screenSchemeId}.` : 'No screens found.');
            return;
        }

        // Sort alphabetically by name
        const sortedScreens = screens.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createScreensTable } = require('../utils/table');
        console.log(createScreensTable(sortedScreens));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteScreens(config, screenIds) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.deleteScreens(screenIds);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Screen ${result.id} deleted successfully.`);
        } else {
            console.log(`✗ Error deleting screen ${result.id}: ${result.error}`);
        }
    });
}

async function listFields(config, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Searching fields');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Prepare search parameters
        const searchParams = {};
        
        // Map options to API parameters
        if (options.startAt !== undefined) searchParams.startAt = options.startAt;
        if (options.maxResults !== undefined) searchParams.maxResults = options.maxResults;
        if (options.type) searchParams.type = options.type;
        if (options.id) searchParams.id = options.id;
        if (options.query) searchParams.query = options.query;
        if (options.orderBy) searchParams.orderBy = options.orderBy;
        if (options.expand) searchParams.expand = options.expand;
        if (options.projectIds) searchParams.projectIds = options.projectIds;

        // Always expand screensCount, contextsCount, and lastUsed to get usage information
        if (!searchParams.expand) {
            searchParams.expand = 'screensCount,contextsCount,lastUsed';
        } else {
            // Add missing expand parameters
            const expandParams = searchParams.expand.split(',');
            if (!expandParams.includes('screensCount')) {
                expandParams.push('screensCount');
            }
            if (!expandParams.includes('contextsCount')) {
                expandParams.push('contextsCount');
            }
            if (!expandParams.includes('lastUsed')) {
                expandParams.push('lastUsed');
            }
            searchParams.expand = expandParams.join(',');
        }

        const fields = await jira.searchFields(searchParams);
        loader.stop();

        if (fields.length === 0) {
            console.log('No fields found with the specified filters.');
            return;
        }

        // Sort by name alphabetically
        const sortedFields = fields.sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });

        const { createFieldsTable } = require('../utils/table');
        console.log(createFieldsTable(sortedFields));
        
        // Show pagination info if applicable
        if (options.startAt !== undefined || options.maxResults !== undefined) {
            console.log(`\nTotal de campos: ${fields.length}`);
            if (options.startAt !== undefined) {
                console.log(`Início: ${options.startAt}`);
            }
        }
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function getIssue(config, issueIdOrKey, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader(`Searching issue ${issueIdOrKey}`);
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Prepare API options
        const apiOptions = {};
        if (options.expand) apiOptions.expand = options.expand;
        if (options.properties) apiOptions.properties = options.properties;
        
        // Merge default fields with requested fields
        let fields = options.fields;
        if (fields) {
            // Split into array, trim each
            const requestedFields = fields.split(',').map(f => f.trim());
            // Define default fields that should always be included
            const defaultFields = [
                'summary',
                'description',
                'issuetype',
                'status',
                'priority',
                'assignee',
                'reporter',
                'created',
                'updated',
                'resolution',
                'resolutiondate',
                'duedate',
                'project'
            ];
            // Merge, removing duplicates
            const mergedFields = [...new Set([...defaultFields, ...requestedFields])];
            fields = mergedFields.join(',');
        }
        if (fields) apiOptions.fields = fields;
        
        const issue = await jira.getIssue(issueIdOrKey, apiOptions);
        loader.stop();

        const { createIssueDetailTable } = require('../utils/table');
        console.log(createIssueDetailTable(issue, options.fields)); // Pass original requested fields for filtering
        
        return issue;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function searchIssues(config, jql, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader(`Searching issues com JQL: ${jql.substring(0, 50)}${jql.length > 50 ? '...' : ''}`);
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Prepare API options
        const apiOptions = {
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50
        };
        if (options.fields) apiOptions.fields = options.fields;
        if (options.expand) apiOptions.expand = options.expand;
        if (options.validateQuery !== undefined) apiOptions.validateQuery = options.validateQuery;
        
        const searchResults = await jira.searchIssues(jql, apiOptions);
        loader.stop();

        console.log(`Total de issues encontradas: ${searchResults.total}`);
        console.log(`Mostrando ${searchResults.issues?.length || 0} issues (início: ${searchResults.startAt || 0})`);
        
        if (searchResults.issues && searchResults.issues.length > 0) {
            const { createIssuesTable } = require('../utils/table');
            console.log(createIssuesTable(searchResults.issues));
        }
        
        return searchResults;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function getIssuesBatch(config, issueIdsOrKeys, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader(`Buscando ${issueIdsOrKeys.length} issues`);
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Prepare API options
        const apiOptions = {};
        if (options.fields) apiOptions.fields = options.fields;
        if (options.expand) apiOptions.expand = options.expand;
        
        const results = await jira.getIssuesBatch(issueIdsOrKeys, apiOptions);
        loader.stop();

        // Count successes and failures
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`Resultados: ${successCount} sucessos, ${failureCount} falhas`);
        
        // Display successful issues in a table
        const successfulIssues = results.filter(r => r.success).map(r => r.data);
        if (successfulIssues.length > 0) {
            const { createIssuesTable } = require('../utils/table');
            console.log('\nIssues encontradas:');
            console.log(createIssuesTable(successfulIssues));
        }
        
        // Display failures
        if (failureCount > 0) {
            console.log('\nFalhas:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`✗ ${result.issueIdOrKey}: ${result.error}`);
            });
        }
        
        // Display rate limit info if any rate limits were hit
        displayRateLimitInfo(jira);
        
        return results;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function setIssueFieldValue(config, issueIdOrKey, fieldId, value, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader(`Updating field ${fieldId} na issue ${issueIdOrKey}`);
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Check if execution mode (default is preview)
        if (!options.exec) {
            loader.stop();
            const mode = options.append ? 'append' : 'replace';
            console.log(`[PREVIEW] Campo ${fieldId} seria atualizado na issue ${issueIdOrKey} (modo: ${mode})`);
            console.log(`[PREVIEW] Valor: ${value}`);
            if (options.append && options.separator) {
                console.log(`[PREVIEW] Separador: "${options.separator}"`);
            }
            console.log(`[PREVIEW] Para executar a atualização, adicione a opção --exec`);
            return { preview: true, issueIdOrKey, fieldId, value, mode };
        }
        
        const updateOptions = {};
        if (options.append) updateOptions.append = true;
        if (options.separator) updateOptions.separator = options.separator;
        
        const result = await jira.updateIssueField(issueIdOrKey, fieldId, value, updateOptions);
        loader.stop();
        
        const mode = options.append ? 'adicionado ao' : 'atualizado no';
        console.log(`✓ Campo ${fieldId} ${mode} campo da issue ${issueIdOrKey}`);
        return result;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function setIssueFieldValueBatch(config, issueIdsOrKeys, fieldId, value, options = {}) {
    const Loader = require('../utils/loader');
    const operationLogger = require('../utils/operationLogger');
    const jira = new JiraApi(config.url, config.email, config.token);
    
    // Generate operation ID for this batch
    const operationId = operationLogger.generateOperationId();
    
    const loader = new Loader(`Updating field ${fieldId} em ${issueIdsOrKeys.length} issues`);
    loader.start();

    try {
        // Check if execution mode (default is preview)
        if (!options.exec) {
            loader.stop();
            const mode = options.append ? 'append' : 'replace';
            console.log(`[PREVIEW] Campo ${fieldId} seria atualizado em ${issueIdsOrKeys.length} issues (modo: ${mode})`);
            console.log(`[PREVIEW] Issues: ${issueIdsOrKeys.join(', ')}`);
            console.log(`[PREVIEW] Valor: ${value}`);
            if (options.append && options.separator) {
                console.log(`[PREVIEW] Separador: "${options.separator}"`);
            }
            console.log(`[PREVIEW] Para executar a atualização, adicione a opção --exec`);
            return { preview: true, count: issueIdsOrKeys.length, fieldId, value, mode };
        }
        
        const updateOptions = {};
        if (options.append) updateOptions.append = true;
        if (options.separator) updateOptions.separator = options.separator;
        
        const results = await jira.updateIssueFieldsBatch(issueIdsOrKeys, fieldId, value, updateOptions);
        loader.stop();
        
        // Count successes and failures
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`\n✓ Batch operation completed with ID: ${operationId}`);
        console.log(`Resultados: ${successCount} sucessos, ${failureCount} falhas`);
        console.log(`\nTo undo this operation, use: jira-cli undo-last-field-operation -o "${operationId}" -t ${fieldId} --exec`);
        
        // Display successes
        if (successCount > 0) {
            const mode = options.append ? 'adicionado ao' : 'atualizado no';
            console.log('\nSucessos:');
            results.filter(r => r.success).forEach(result => {
                console.log(`✓ ${result.issueIdOrKey}: Campo ${fieldId} ${mode} campo`);
            });
        }
        
        // Display failures
        if (failureCount > 0) {
            console.log('\nFalhas:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`✗ ${result.issueIdOrKey}: ${result.error}`);
            });
        }
        
        // Display rate limit info if any rate limits were hit
        displayRateLimitInfo(jira);
        
        return results;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function copyIssueFieldsValues(config, sourceIssueIdOrKey, sourceFields, targetFieldId, options = {}) {
    const Loader = require('../utils/loader');
    const loader = new Loader(`Copying field values from ${sourceFields.length} source fields to ${targetFieldId} in issue ${sourceIssueIdOrKey}`);
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // Check if execution mode (default is preview)
        if (!options.exec) {
            loader.stop();
            console.log(`[PREVIEW] Values from fields [${sourceFields.join(', ')}] would be copied to ${targetFieldId} in issue ${sourceIssueIdOrKey}`);
            if (options.append) {
                console.log(`[PREVIEW] Mode: append (add to existing value)`);
                if (options.separator) {
                    console.log(`[PREVIEW] Separator: "${options.separator}"`);
                }
            } else {
                console.log(`[PREVIEW] Mode: replace (overwrite existing value)`);
            }
            if (options.fieldSeparator) {
                console.log(`[PREVIEW] Field separator: "${options.fieldSeparator}"`);
            }
            console.log(`[PREVIEW] To execute copy, add --exec option`);
            return { preview: true, sourceIssueIdOrKey, sourceFields, targetFieldId, options };
        }
        
        const copyOptions = {};
        if (options.append) copyOptions.append = true;
        if (options.separator) copyOptions.separator = options.separator;
        if (options.fieldSeparator) copyOptions.fieldSeparator = options.fieldSeparator;
        
        const result = await jira.copyMultipleFieldValues(sourceIssueIdOrKey, sourceFields, targetFieldId, copyOptions);
        loader.stop();
        
        console.log(`✓ Values copied from fields [${sourceFields.join(', ')}] to ${targetFieldId} in issue ${sourceIssueIdOrKey}`);
        return result;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function copyIssueFieldsValuesBatch(config, issueIdsOrKeys, sourceFields, targetFieldId, options = {}) {
    const Loader = require('../utils/loader');
    const operationLogger = require('../utils/operationLogger');
    const jira = new JiraApi(config.url, config.email, config.token);
    
    // Generate operation ID for this batch
    const operationId = operationLogger.generateOperationId();
    
    let finalIssueIds = issueIdsOrKeys;
    
    // If JQL is provided, search for issues first
    if (options.jql) {
        const loader = new Loader(`Searching issues with JQL: ${options.jql.substring(0, 50)}${options.jql.length > 50 ? '...' : ''}`);
        loader.start();
        
        try {
            // Search all issues matching JQL with pagination
            let allIssues = [];
            let startAt = 0;
            const maxResults = 1000; // Large batch for efficiency
            let hasMore = true;
            
            while (hasMore) {
                const searchResults = await jira.searchIssues(options.jql, {
                    startAt,
                    maxResults,
                    fields: 'key' // Only need keys for the search
                });
                
                if (searchResults.issues && searchResults.issues.length > 0) {
                    allIssues.push(...searchResults.issues.map(issue => issue.key));
                    startAt += maxResults;
                    hasMore = searchResults.issues.length === maxResults;
                } else {
                    hasMore = false;
                }
            }
            
            loader.stop();
            
            if (allIssues.length === 0) {
                console.log('No issues found matching the JQL query.');
                return [];
            }
            
            console.log(`Found ${allIssues.length} issues matching JQL query.`);
            finalIssueIds = allIssues;
        } catch (error) {
            loader.stop();
            throw error;
        }
    }
    
    const loader = new Loader(`Copying field values from ${sourceFields.length} source fields to ${targetFieldId} in ${finalIssueIds.length} issues`);
    loader.start();

    try {
        // Check if execution mode (default is preview)
        if (!options.exec) {
            loader.stop();
            
            // Enhanced preview with detailed information
            console.log('\n' + '='.repeat(80));
            console.log('📋 COPY FIELD VALUES BATCH - PREVIEW');
            console.log('='.repeat(80));
            
            // 1. Operation scope - prominently display item count
            console.log(`\n📊 OPERATION SCOPE:`);
            console.log(`   Total issues to process: ${finalIssueIds.length}`);
            
            if (options.jql) {
                console.log(`   Issues found via JQL: ${options.jql}`);
            } else if (issueIdsOrKeys) {
                console.log(`   Issues specified directly: ${issueIdsOrKeys.length} issue(s)`);
            }
            
            // 2. Field mapping details
            console.log(`\n🔄 FIELD MAPPING:`);
            console.log(`   Source fields: [${sourceFields.join(', ')}]`);
            console.log(`   Target field: ${targetFieldId}`);
            
            // 3. Operation mode and settings
            console.log(`\n⚙️  OPERATION SETTINGS:`);
            const mode = options.append ? 'append (add to existing value)' : 'replace (overwrite existing value)';
            console.log(`   Mode: ${mode}`);
            
            if (options.append && options.separator) {
                console.log(`   Append separator: "${options.separator}"`);
            }
            if (options.fieldSeparator) {
                console.log(`   Field separator: "${options.fieldSeparator}"`);
            }
            
            // 4. Performance and estimated impact
            console.log(`\n📈 PERFORMANCE ESTIMATES:`);
            const batchSize = options.batchSize || 10;
            const chunkSize = options.chunkSize || 100;
            console.log(`   Batch size: ${batchSize} (issues processed in parallel)`);
            console.log(`   Chunk size: ${chunkSize} (issues per chunk)`);
            
            // Calculate estimated API calls
            const estimatedApiCalls = Math.ceil(finalIssueIds.length / batchSize) * 2; // Rough estimate: 2 API calls per batch
            console.log(`   Estimated API calls: ~${estimatedApiCalls}`);
            
            // Estimate time (rough calculation: 0.5 seconds per batch + overhead)
            const estimatedTimeSeconds = Math.max(5, Math.ceil(finalIssueIds.length / batchSize) * 0.5);
            console.log(`   Estimated time: ~${estimatedTimeSeconds} seconds`);
            
            // 5. Sample of affected issues
            console.log(`\n🔍 SAMPLE OF AFFECTED ISSUES (first 10):`);
            const sampleIssues = finalIssueIds.slice(0, 10);
            if (sampleIssues.length > 0) {
                sampleIssues.forEach((issueKey, index) => {
                    console.log(`   ${index + 1}. ${issueKey}`);
                });
                if (finalIssueIds.length > 10) {
                    console.log(`   ... and ${finalIssueIds.length - 10} more issues`);
                }
            } else {
                console.log(`   No issues found`);
            }
            
            // 6. Warnings and recommendations
            console.log(`\n⚠️  RECOMMENDATIONS:`);
            if (finalIssueIds.length > 100) {
                console.log(`   • Large operation (${finalIssueIds.length} issues) - consider testing with a subset first`);
                console.log(`   • Use --dry-run or test with a small JQL subset before full execution`);
            }
            if (options.append) {
                console.log(`   • Append mode will preserve existing content in target field`);
            } else {
                console.log(`   • Replace mode will overwrite existing content in target field`);
            }
            console.log(`   • Review sample issues above to ensure correct scope`);
            
            // 7. Execution instructions
            console.log(`\n🚀 TO EXECUTE THIS OPERATION:`);
            console.log(`   Add the --exec option to your command`);
            console.log(`\n` + '='.repeat(80));
            console.log(`[PREVIEW] This is a preview only. No changes have been made.`);
            console.log('='.repeat(80) + '\n');
            
            return { preview: true, count: finalIssueIds.length, sourceFields, targetFieldId, options };
        }
        
        // Progress tracking
        let processedCount = 0;
        const totalCount = finalIssueIds.length;
        const startTime = Date.now();
        
        const onProgress = (count) => {
            processedCount = count;
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = count / elapsed;
            const eta = totalCount > count ? (totalCount - count) / rate : 0;
            
            loader.text = `Processing ${count}/${totalCount} issues (${(count/totalCount*100).toFixed(1)}%) - ETA: ${Math.round(eta)}s`;
        };
        
        const copyOptions = {
            ...options,
            onProgress
        };
        if (options.append) copyOptions.append = true;
        if (options.separator) copyOptions.separator = options.separator;
        if (options.fieldSeparator) copyOptions.fieldSeparator = options.fieldSeparator;
        
        const results = await jira.copyMultipleFieldValuesBatch(finalIssueIds, sourceFields, targetFieldId, copyOptions);
        loader.stop();
        
        // Count successes and failures
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        const totalTime = (Date.now() - startTime) / 1000;
        
        console.log(`\n✓ Batch operation completed with ID: ${operationId}`);
        console.log(`Results: ${successCount} successes, ${failureCount} failures`);
        console.log(`Total time: ${totalTime.toFixed(1)}s (${(totalCount/totalTime).toFixed(1)} issues/sec)`);
        console.log(`\nTo undo this operation, use: jira-cli undo-last-field-operation -o "${operationId}" -t ${targetFieldId} --exec`);
        
        // Display successes (limited to avoid overwhelming output)
        if (successCount > 0) {
            console.log('\nSuccesses:');
            const successResults = results.filter(r => r.success);
            const displayCount = Math.min(successResults.length, 10);
            
            for (let i = 0; i < displayCount; i++) {
                const result = successResults[i];
                console.log(`✓ ${result.issueIdOrKey}: Fields [${sourceFields.join(', ')}] copied to ${targetFieldId}`);
            }
            
            if (successResults.length > displayCount) {
                console.log(`... and ${successResults.length - displayCount} more successful operations`);
            }
        }
        
        // Display failures (limited to avoid overwhelming output)
        if (failureCount > 0) {
            console.log('\nFailures:');
            const failureResults = results.filter(r => !r.success);
            const displayCount = Math.min(failureResults.length, 10);
            
            for (let i = 0; i < displayCount; i++) {
                const result = failureResults[i];
                console.log(`✗ ${result.issueIdOrKey}: ${result.error}`);
            }
            
            if (failureResults.length > displayCount) {
                console.log(`... and ${failureResults.length - displayCount} more failures`);
            }
        }
        
        // Display rate limit info if any rate limits were hit
        displayRateLimitInfo(jira);
        
        return results;
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function cleanupComplete(config, execute = false) {
    const Loader = require('../utils/loader');
    const EmailLogger = require('../utils/emailLogger');
    let emailLogger = null;

    if (execute) {
        emailLogger = new EmailLogger(config);
    }

    const loader = new Loader(execute ? 'Executing cleanup completa' : 'Analyzing recursos para limpeza completa');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        
        // 1. Unused workflow schemes
        loader.text = execute ? 'Buscando e excluindo workflow schemes unuseds' : 'Searching workflow schemes unuseds';
        const unusedWorkflowSchemes = await jira.getUnusedWorkflowSchemes();
        if (unusedWorkflowSchemes.length > 0) {
            loader.stop();
            console.log(`\n1. Workflow schemes unuseds founds: ${unusedWorkflowSchemes.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });
                unusedWorkflowSchemes.forEach(scheme => {
                    table.push([scheme.id || 'N/A', scheme.name || 'N/A', scheme.description || 'No description']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedWorkflowSchemes.length} workflow schemes.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos workflow schemes? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de workflow schemes cancelada.');
                } else {
                    const schemeIds = unusedWorkflowSchemes.map(s => s.id);
                    const results = await jira.deleteWorkflowSchemes(schemeIds);
                    console.log(`Deletion results de workflow schemes (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Workflow scheme ${result.id} deleted successfully.`
                            : `✗ Error deleting workflow scheme ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n1. No workflow scheme unused found.');
        }

        // 2. Unused workflows (inactive without schemes)
        loader.text = execute ? 'Buscando e excluindo workflows unuseds' : 'Searching workflows unuseds';
        const unusedWorkflows = await jira.getInactiveWorkflowsForCleanup();
        if (unusedWorkflows.length > 0) {
            loader.stop();
            console.log(`\n2. Workflows inativos unuseds founds: ${unusedWorkflows.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name'],
                    colWidths: [40, 80]
                });
                unusedWorkflows.forEach(workflow => {
                    table.push([workflow.id || 'N/A', workflow.name || 'N/A']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedWorkflows.length} workflows.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos workflows? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de workflows cancelada.');
                } else {
                    const workflowIds = unusedWorkflows.map(w => w.id);
                    const results = await jira.deleteWorkflows(workflowIds);
                    console.log(`Deletion results de workflows (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Workflow ${result.id} deleted successfully.`
                            : `✗ Error deleting workflow ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n2. No workflow inativo unused found.');
        }

        // 3. Unused issue type screen schemes
        loader.text = execute ? 'Buscando e excluindo issue type screen schemes unuseds' : 'Searching issue type screen schemes unuseds';
        const unusedIssueTypeScreenSchemes = await jira.getUnusedIssueTypeScreenSchemes();
        if (unusedIssueTypeScreenSchemes.length > 0) {
            loader.stop();
            console.log(`\n3. Issue type screen schemes unuseds founds: ${unusedIssueTypeScreenSchemes.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });
                unusedIssueTypeScreenSchemes.forEach(scheme => {
                    table.push([scheme.id || 'N/A', scheme.name || 'N/A', scheme.description || 'No description']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedIssueTypeScreenSchemes.length} issue type screen schemes.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos issue type screen schemes? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de issue type screen schemes cancelada.');
                } else {
                    const schemeIds = unusedIssueTypeScreenSchemes.map(s => s.id);
                    const results = await jira.deleteIssueTypeScreenSchemes(schemeIds);
                    console.log(`Deletion results de issue type screen schemes (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Issue type screen scheme ${result.id} deleted successfully.`
                            : `✗ Error deleting issue type screen scheme ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n3. No issue type screen scheme unused found.');
        }

        // 4. Unused issue type schemes
        loader.text = execute ? 'Buscando e excluindo issue type schemes unuseds' : 'Searching issue type schemes unuseds';
        const unusedIssueTypeSchemes = await jira.getUnusedIssueTypeSchemes();
        if (unusedIssueTypeSchemes.length > 0) {
            loader.stop();
            console.log(`\n4. Issue type schemes unuseds founds: ${unusedIssueTypeSchemes.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });
                unusedIssueTypeSchemes.forEach(scheme => {
                    table.push([scheme.id || 'N/A', scheme.name || 'N/A', scheme.description || 'No description']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedIssueTypeSchemes.length} issue type schemes.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos issue type schemes? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de issue type schemes cancelada.');
                } else {
                    const schemeIds = unusedIssueTypeSchemes.map(s => s.id);
                    const results = await jira.deleteIssueTypeSchemes(schemeIds);
                    console.log(`Deletion results de issue type schemes (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Issue type scheme ${result.id} deleted successfully.`
                            : `✗ Error deleting issue type scheme ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n4. No issue type scheme unused found.');
        }

        // 5. Unused screen schemes
        loader.text = execute ? 'Buscando e excluindo screen schemes unuseds' : 'Searching screen schemes unuseds';
        const unusedScreenSchemes = await jira.getUnusedScreenSchemes();
        if (unusedScreenSchemes.length > 0) {
            loader.stop();
            console.log(`\n5. Screen schemes unuseds founds: ${unusedScreenSchemes.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name', 'Description'],
                    colWidths: [30, 40, 50]
                });
                unusedScreenSchemes.forEach(scheme => {
                    table.push([scheme.id || 'N/A', scheme.name || 'N/A', scheme.description || 'No description']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedScreenSchemes.length} screen schemes.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos screen schemes? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de screen schemes cancelada.');
                } else {
                    const schemeIds = unusedScreenSchemes.map(s => s.id);
                    const results = await jira.deleteScreenSchemes(schemeIds);
                    console.log(`Deletion results de screen schemes (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Screen scheme ${result.id} deleted successfully.`
                            : `✗ Error deleting screen scheme ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n5. No screen scheme unused found.');
        }

        // 6. Unused screens
        loader.text = execute ? 'Buscando e excluindo screens unuseds' : 'Searching screens unuseds';
        const unusedScreens = await jira.getUnusedScreens();
        if (unusedScreens.length > 0) {
            loader.stop();
            console.log(`\n6. Screens unuseds founds: ${unusedScreens.length}`);
            if (!execute) {
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Name'],
                    colWidths: [40, 80]
                });
                unusedScreens.forEach(screen => {
                    table.push([screen.id || 'N/A', screen.name || 'N/A']);
                });
                console.log(table.toString());
                console.log('Para excluir, adicione a opção --exec');
            } else {
                console.log(`Will be deleted ${unusedScreens.length} screens.`);
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const answer = await new Promise(resolve => {
                    rl.question('Confirm deletion dos screens? (Y/N): ', resolve);
                });
                rl.close();
                if (answer.toUpperCase() !== 'Y') {
                    console.log('Exclusão de screens cancelada.');
                } else {
                    const screenIds = unusedScreens.map(s => s.id);
                    const results = await jira.deleteScreens(screenIds);
                    console.log(`Deletion results de screens (${results.length}):`);
                    results.forEach(result => {
                        const message = result.success
                            ? `✓ Screen ${result.id} deleted successfully.`
                            : `✗ Error deleting screen ${result.id}: ${result.error}`;
                        console.log(message);
                    });
                }
            }
            loader.start();
        } else {
            console.log('\n6. No screen unused found.');
        }

        loader.stop();
        console.log('\n' + '='.repeat(60));
        console.log('Complete cleanup completed.');
        if (execute && emailLogger) {
            await emailLogger.sendLog('Cleanup Complete - Executed', 'Complete cleanup executada com sucesso.');
        }
    } catch (error) {
        loader.stop();
        if (emailLogger) {
            await emailLogger.sendLog('Cleanup Complete - Erro', `Erro: ${error.message}`);
        }
        throw error;
    }
}

const commands = {
    listProjects,
    listCategories,
    archiveProject,
    archiveProjects,
    updateProjectName,
    updateProjectCategory,
    updateProjectsCategory,
    listProjectsByCategory,
    deleteProjects,
    listWorkflows,
    deleteWorkflows,
    deleteWorkflowSchemes,
    listWorkflowSchemes,
    cleanupWorkflows,
    cleanupWorkflowSchemes,
    cleanupComplete,
    listIssueTypeScreenSchemes,
    deleteIssueTypeScreenSchemes,
    listIssueTypeSchemes,
    deleteIssueTypeSchemes,
    listIssueTypes,
    deleteIssueTypes,
    listScreenSchemes,
    deleteScreenSchemes,
    listScreens,
    deleteScreens,
    listFields,
    getIssue,
    searchIssues,
    getIssuesBatch,
    setIssueFieldValue,
    setIssueFieldValueBatch,
    copyIssueFieldsValues,
    copyIssueFieldsValuesBatch,
    undoFieldOperation,

};

// Apply 120-second timeout to all command functions
module.exports = applyTimeoutToObject(commands, 120000);

/**
 * Display rate limit information if any rate limits were encountered
 * @param {JiraApi} jira - JiraApi instance
 */
function displayRateLimitInfo(jira) {
    const rateLimitInfo = jira.getRateLimitInfo();
    
    if (rateLimitInfo.summary.totalHits > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  RATE LIMIT INFORMATION');
        console.log('='.repeat(60));
        console.log(`Total rate limit hits: ${rateLimitInfo.summary.totalHits}`);
        
        if (rateLimitInfo.summary.reasons) {
            console.log('\nRate limit reasons:');
            Object.entries(rateLimitInfo.summary.reasons).forEach(([reason, count]) => {
                console.log(`  • ${reason}: ${count} times`);
            });
        }
        
        if (rateLimitInfo.summary.operations) {
            console.log('\nAffected operations:');
            Object.entries(rateLimitInfo.summary.operations).forEach(([operation, count]) => {
                console.log(`  • ${operation}: ${count} times`);
            });
        }
        
        if (rateLimitInfo.summary.firstHit && rateLimitInfo.summary.lastHit) {
            console.log(`\nTime range: ${rateLimitInfo.summary.firstHit} to ${rateLimitInfo.summary.lastHit}`);
        }
        
        console.log('\nAll rate limits were handled automatically with retry logic.');
        console.log('Your operations completed successfully despite the rate limiting.');
        console.log('='.repeat(60));
    }
}

async function undoFieldOperation(config, options = {}) {
    const { undoFieldOperation } = require('../utils/undoOperation');
    return await undoFieldOperation(config, options);
}