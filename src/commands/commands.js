const JiraApi = require('../services/jiraApi');
const { createProjectsTable } = require('../utils/table');
const Table = require('cli-table3');
const { applyTimeoutToObject } = require('../utils/timeout');

async function listProjects(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando projetos');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const projects = await jira.listProjects();

        loader.stop();

        // Ordenar por categoria e depois por última atividade
        const sortedProjects = projects.sort((a, b) => {
            const categoryA = a.projectCategory?.name || 'Sem categoria';
            const categoryB = b.projectCategory?.name || 'Sem categoria';

            if (categoryA !== categoryB) {
                return categoryA.localeCompare(categoryB);
            }

            const dateA = a.insight?.lastIssueUpdateTime ? new Date(a.insight.lastIssueUpdateTime) : new Date(0);
            const dateB = b.insight?.lastIssueUpdateTime ? new Date(b.insight.lastIssueUpdateTime) : new Date(0);

            return dateB - dateA; // Mais recente primeiro
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
        head: ['ID', 'Nome', 'Descrição'],
        colWidths: [10, 30, 50]
    });

    categories.forEach(category => {
        table.push([
            category.id,
            category.name || 'N/A',
            category.description || 'Sem descrição'
        ]);
    });

    console.log(table.toString());
}

async function archiveProjects(config, projectKeys) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.archiveProjects(projectKeys);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Projeto ${result.key} arquivado com sucesso.`);
        } else {
            console.log(`✗ Erro ao arquivar projeto ${result.key}: ${result.error}`);
        }
    });
}

async function updateProjectsCategory(config, projectKeys, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.updateProjectsCategory(projectKeys, categoryId);

    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Categoria do projeto ${result.key} alterada com sucesso.`);
        } else {
            console.log(`✗ Erro ao alterar categoria do projeto ${result.key}: ${result.error}`);
        }
    });
}

async function listProjectsByCategory(config, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const projects = await jira.listProjectsByCategory(categoryId);

    // Ordenar por data de última atividade (mais recente primeiro)
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
            console.log(`✓ Projeto ${result.key} excluído com sucesso.`);
        } else {
            console.log(`✗ Erro ao excluir projeto ${result.key}: ${result.error}`);
        }
    });
}

async function listWorkflows(config, isActive) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando workflows');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const workflows = await jira.listWorkflows(isActive);

        loader.stop();

        // Ordenar por nome alfabeticamente
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
        const loader = new Loader(exec ? 'Buscando e excluindo workflows não utilizados' : 'Buscando workflows não utilizados');
        loader.start();

        try {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                console.log('Nenhum workflow inativo não utilizado encontrado.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Nome'],
                    colWidths: [40, 80]
                });

                workflowsToDelete.forEach(workflow => {
                    table.push([workflow.id || 'N/A', workflow.name || 'N/A']);
                });

                console.log(`\nWorkflows inativos não utilizados que seriam excluídos (${workflowsToDelete.length}):`);
                console.log(table.toString());
                console.log('\nPara executar a exclusão, adicione a opção --exec');
                return;
            }

            // Execution mode
            console.log(`\nSerão excluídos ${workflowsToDelete.length} workflows inativos não utilizados.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operação cancelada.');
                return;
            }

            const idsToDelete = workflowsToDelete.map(w => w.id);
            const results = await jira.deleteWorkflows(idsToDelete);

            console.log(`\nResultados da exclusão (${results.length} workflows):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir workflow ${result.id}: ${result.error}`;
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
                console.log(`✓ Workflow ${result.id} excluído com sucesso.`);
            } else {
                console.log(`✗ Erro ao excluir workflow ${result.id}: ${result.error}`);
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
        const loader = new Loader(exec ? 'Buscando e excluindo workflow schemes não utilizados' : 'Buscando workflow schemes não utilizados');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedWorkflowSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('Nenhum workflow scheme não utilizado encontrado.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Nome', 'Descrição'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'Sem descrição'
                    ]);
                });

                console.log(`\nWorkflow schemes não utilizados que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nPara executar a exclusão, adicione a opção --exec');
                return;
            }

            // Execution mode
            console.log(`\nSerão excluídos ${schemesToDelete.length} workflow schemes não utilizados.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operação cancelada.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteWorkflowSchemes(idsToDelete);

            console.log(`\nResultados da exclusão (${results.length} workflow schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow scheme ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir workflow scheme ${result.id}: ${result.error}`;
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
                console.log(`✓ Workflow scheme ${result.id} excluído com sucesso.`);
            } else {
                console.log(`✗ Erro ao excluir workflow scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listWorkflowSchemes(config) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const schemes = await jira.listWorkflowSchemes();

    // Ordenar por nome alfabeticamente
    const sortedSchemes = schemes.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
    });

    const { createWorkflowSchemesTable } = require('../utils/table');
    console.log(createWorkflowSchemesTable(sortedSchemes));
}

async function archiveProject(config, projectKey) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.archiveProject(projectKey);
    console.log(`Projeto ${projectKey} arquivado com sucesso.`);
}

async function updateProjectName(config, projectKey, newName) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.updateProject(projectKey, { name: newName });
    console.log(`Nome do projeto ${projectKey} alterado para: ${newName}`);
}

async function updateProjectCategory(config, projectKey, categoryId) {
    const jira = new JiraApi(config.url, config.email, config.token);
    await jira.updateProject(projectKey, { projectCategory: { id: categoryId } });
    console.log(`Categoria do projeto ${projectKey} alterada.`);
}

async function cleanupWorkflows(config, execute = false) {
    const Loader = require('../utils/loader');
    const EmailLogger = require('../utils/emailLogger');
    let emailLogger = null;

    if (execute) {
        emailLogger = new EmailLogger(config);
    }

    const loader = new Loader(execute ? 'Executando limpeza de workflows' : 'Analisando workflows para limpeza');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);

        if (execute) {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                const message = 'Nenhum workflow inativo sem esquemas encontrado para limpeza.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflows', message);
                return;
            }

            console.log(`\nSerão excluídos ${workflowsToDelete.length} workflows inativos.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                const message = 'Operação cancelada.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflows - Cancelado', message);
                return;
            }

            const workflowIds = workflowsToDelete.map(w => w.id);
            const results = await jira.deleteWorkflows(workflowIds);

            let logContent = `Resultados da limpeza (${results.length} workflows):\n`;
            console.log(`\nResultados da limpeza (${results.length} workflows):`);
            console.log('='.repeat(60));

            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir workflow ${result.id}: ${result.error}`;
                console.log(message);
                logContent += message + '\n';
            });

            await emailLogger.sendLog('Cleanup Workflows - Executado', logContent);
        } else {
            const workflowsToDelete = await jira.getInactiveWorkflowsForCleanup();
            loader.stop();

            if (workflowsToDelete.length === 0) {
                const message = 'Nenhum workflow inativo sem esquemas encontrado para limpeza.';
                console.log(message);
                return;
            }

            const Table = require('cli-table3');
            const table = new Table({
                head: ['ID', 'Nome'],
                colWidths: [40, 80]
            });

            workflowsToDelete.forEach(workflow => {
                table.push([workflow.id || 'N/A', workflow.name || 'N/A']);
            });

            const tableOutput = table.toString();
            console.log(`\nWorkflows inativos que seriam excluídos (${workflowsToDelete.length}):`);
            console.log(tableOutput);

            // Versão limpa para email (sem códigos de cor)
            let emailContent = `Workflows inativos que seriam excluídos (${workflowsToDelete.length}):\n\n`;
            workflowsToDelete.forEach(workflow => {
                emailContent += `ID: ${workflow.id}\nNome: ${workflow.name}\n\n`;
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

    const loader = new Loader(execute ? 'Executando limpeza de workflow schemes' : 'Analisando workflow schemes para limpeza');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);

        if (execute) {
            const schemesToDelete = await jira.getInactiveWorkflowSchemesForCleanup();
            loader.stop();

            if (schemesToDelete.length === 0) {
                const message = 'Nenhum workflow scheme inativo encontrado para limpeza.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflow Schemes', message);
                return;
            }

            console.log(`\nSerão excluídos ${schemesToDelete.length} workflow schemes inativos.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                const message = 'Operação cancelada.';
                console.log(message);
                await emailLogger.sendLog('Cleanup Workflow Schemes - Cancelado', message);
                return;
            }

            const schemeIds = schemesToDelete.map(s => s.id);
            const results = await jira.deleteWorkflowSchemes(schemeIds);

            let logContent = `Resultados da limpeza (${results.length} workflow schemes):\n`;
            console.log(`\nResultados da limpeza (${results.length} workflow schemes):`);
            console.log('='.repeat(60));

            results.forEach(result => {
                const message = result.success
                    ? `✓ Workflow scheme ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir workflow scheme ${result.id}: ${result.error}`;
                console.log(message);
                logContent += message + '\n';
            });

            await emailLogger.sendLog('Cleanup Workflow Schemes - Executado', logContent);
        } else {
            const schemesToDelete = await jira.getInactiveWorkflowSchemesForCleanup();
            loader.stop();

            if (schemesToDelete.length === 0) {
                const message = 'Nenhum workflow scheme inativo encontrado para limpeza.';
                console.log(message);
                return;
            }

            const Table = require('cli-table3');
            const table = new Table({
                head: ['ID', 'Nome', 'Descrição'],
                colWidths: [30, 40, 50]
            });

            schemesToDelete.forEach(scheme => {
                table.push([
                    scheme.id || 'N/A',
                    scheme.name || 'N/A',
                    scheme.description || 'Sem descrição'
                ]);
            });

            const tableOutput = table.toString();
            console.log(`\nWorkflow schemes inativos que seriam excluídos (${schemesToDelete.length}):`);
            console.log(tableOutput);

            let emailContent = `Workflow schemes inativos que seriam excluídos (${schemesToDelete.length}):\n\n`;
            schemesToDelete.forEach(scheme => {
                emailContent += `ID: ${scheme.id}\nNome: ${scheme.name}\nDescrição: ${scheme.description || 'N/A'}\n\n`;
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
    const loader = new Loader('Buscando issue type screen schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listIssueTypeScreenSchemes();

        loader.stop();

        // Ordenar por nome alfabeticamente
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
        const loader = new Loader(exec ? 'Buscando e excluindo issue type screen schemes não utilizados' : 'Buscando issue type screen schemes não utilizados');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedIssueTypeScreenSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('Nenhum issue type screen scheme não utilizado encontrado.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Nome', 'Descrição'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'Sem descrição'
                    ]);
                });

                console.log(`\nIssue type screen schemes não utilizados que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nPara executar a exclusão, adicione a opção --exec');
                return;
            }

            // Execution mode
            console.log(`\nSerão excluídos ${schemesToDelete.length} issue type screen schemes não utilizados.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operação cancelada.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteIssueTypeScreenSchemes(idsToDelete);

            console.log(`\nResultados da exclusão (${results.length} issue type screen schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Issue type screen scheme ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir issue type screen scheme ${result.id}: ${result.error}`;
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
                console.log(`✓ Issue type screen scheme ${result.id} excluído com sucesso.`);
            } else {
                console.log(`✗ Erro ao excluir issue type screen scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listIssueTypeSchemes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando issue type schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listIssueTypeSchemes();

        loader.stop();

        // Ordenar por nome alfabeticamente
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
        const loader = new Loader(exec ? 'Buscando e excluindo issue type schemes não utilizados' : 'Buscando issue type schemes não utilizados');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedIssueTypeSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('Nenhum issue type scheme não utilizado encontrado.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Nome', 'Descrição'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'Sem descrição'
                    ]);
                });

                console.log(`\nIssue type schemes não utilizados que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nPara executar a exclusão, adicione a opção --exec');
                return;
            }

            // Execution mode
            console.log(`\nSerão excluídos ${schemesToDelete.length} issue type schemes não utilizados.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operação cancelada.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteIssueTypeSchemes(idsToDelete);

            console.log(`\nResultados da exclusão (${results.length} issue type schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Issue type scheme ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir issue type scheme ${result.id}: ${result.error}`;
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
                console.log(`✓ Issue type scheme ${result.id} excluído com sucesso.`);
            } else {
                console.log(`✗ Erro ao excluir issue type scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listIssueTypes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando issue types');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const issueTypes = await jira.listIssueTypes();

        loader.stop();

        // Ordenar por nome alfabeticamente
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
            console.log(`✓ Issue type ${result.id} excluído com sucesso.`);
        } else {
            console.log(`✗ Erro ao excluir issue type ${result.id}: ${result.error}`);
        }
    });
}

async function listScreenSchemes(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando screen schemes');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const schemes = await jira.listScreenSchemes();

        loader.stop();

        // Ordenar por nome alfabeticamente
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
        const loader = new Loader(exec ? 'Buscando e excluindo screen schemes não utilizados' : 'Buscando screen schemes não utilizados');
        loader.start();

        try {
            const schemesToDelete = await jira.getUnusedScreenSchemes();
            loader.stop();

            if (schemesToDelete.length === 0) {
                console.log('Nenhum screen scheme não utilizado encontrado.');
                return;
            }

            if (!exec) {
                // Preview mode
                const Table = require('cli-table3');
                const table = new Table({
                    head: ['ID', 'Nome', 'Descrição'],
                    colWidths: [30, 40, 50]
                });

                schemesToDelete.forEach(scheme => {
                    table.push([
                        scheme.id || 'N/A',
                        scheme.name || 'N/A',
                        scheme.description || 'Sem descrição'
                    ]);
                });

                console.log(`\nScreen schemes não utilizados que seriam excluídos (${schemesToDelete.length}):`);
                console.log(table.toString());
                console.log('\nPara executar a exclusão, adicione a opção --exec');
                return;
            }

            // Execution mode
            console.log(`\nSerão excluídos ${schemesToDelete.length} screen schemes não utilizados.`);
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('Confirma a exclusão? (Y/N): ', resolve);
            });
            rl.close();

            if (answer.toUpperCase() !== 'Y') {
                console.log('Operação cancelada.');
                return;
            }

            const idsToDelete = schemesToDelete.map(s => s.id);
            const results = await jira.deleteScreenSchemes(idsToDelete);

            console.log(`\nResultados da exclusão (${results.length} screen schemes):`);
            console.log('='.repeat(60));
            results.forEach(result => {
                const message = result.success
                    ? `✓ Screen scheme ${result.id} excluído com sucesso.`
                    : `✗ Erro ao excluir screen scheme ${result.id}: ${result.error}`;
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
                console.log(`✓ Screen scheme ${result.id} excluído com sucesso.`);
            } else {
                console.log(`✗ Erro ao excluir screen scheme ${result.id}: ${result.error}`);
            }
        });
    }
}

async function listScreens(config) {
    const Loader = require('../utils/loader');
    const loader = new Loader('Buscando screens');
    loader.start();

    try {
        const jira = new JiraApi(config.url, config.email, config.token);
        const screens = await jira.listScreens();

        loader.stop();

        // Ordenar por nome alfabeticamente
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
            console.log(`✓ Screen ${result.id} excluído com sucesso.`);
        } else {
            console.log(`✗ Erro ao excluir screen ${result.id}: ${result.error}`);
        }
    });
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
    listIssueTypeScreenSchemes,
    deleteIssueTypeScreenSchemes,
    listIssueTypeSchemes,
    deleteIssueTypeSchemes,
    listIssueTypes,
    deleteIssueTypes,
    listScreenSchemes,
    deleteScreenSchemes,
    listScreens,
    deleteScreens
};

// Apply 120-second timeout to all command functions
module.exports = applyTimeoutToObject(commands, 120000);