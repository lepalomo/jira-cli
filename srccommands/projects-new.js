const JiraApi = require('../srcservices/jiraApi');
const { createProjectsTable } = require('../srcutils/table');
const Table = require('cli-table3');

async function listProjects(config) {
    const Loader = require('../srcutils/loader');
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
    const Loader = require('../srcutils/loader');
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
        
        const { createWorkflowsTable } = require('../srcutils/table-new');
        console.log(createWorkflowsTable(sortedWorkflows));
    } catch (error) {
        loader.stop();
        throw error;
    }
}

async function deleteWorkflows(config, workflowIds) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const results = await jira.deleteWorkflows(workflowIds);
    
    results.forEach(result => {
        if (result.success) {
            console.log(`✓ Workflow ${result.id} excluído com sucesso.`);
        } else {
            console.log(`✗ Erro ao excluir workflow ${result.id}: ${result.error}`);
        }
    });
}

async function listWorkflowSchemes(config, isActive = null) {
    const jira = new JiraApi(config.url, config.email, config.token);
    let schemes = await jira.listWorkflowSchemes();
    
    // Filtrar por status se especificado
    if (isActive !== null) {
        schemes = schemes.filter(scheme => scheme.isActive === isActive);
    }
    
    // Ordenar por nome alfabeticamente
    const sortedSchemes = schemes.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
    });
    
    const { createWorkflowSchemesTable } = require('../srcutils/table-new');
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
    const Loader = require('../srcutils/loader');
    const EmailLogger = require('../srcutils/emailLogger');
    const emailLogger = new EmailLogger(config);
    
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
                await emailLogger.sendLog('Cleanup Workflows - Preview', message);
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
            
            await emailLogger.sendLog('Cleanup Workflows - Preview', emailContent);
        }
        
    } catch (error) {
        loader.stop();
        await emailLogger.sendLog('Cleanup Workflows - Erro', `Erro: ${error.message}`);
        throw error;
    }
}

module.exports = {
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
    listWorkflowSchemes,
    cleanupWorkflows
};