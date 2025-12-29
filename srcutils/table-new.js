const Table = require('cli-table3');

function createProjectsTable(projects) {
    const table = new Table({
        head: ['Nome do Projeto', 'Chave', 'Categoria', 'Responsável', 'Última Atividade'],
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
        head: ['ID', 'Nome', 'Status', 'Descrição'],
        colWidths: [10, 30, 12, 40]
    });
    
    schemes.forEach(scheme => {
        table.push([
            scheme.id || 'N/A',
            scheme.name || 'N/A',
            scheme.isActive ? 'Ativo' : 'Inativo',
            scheme.description || 'Sem descrição'
        ]);
    });
    
    return table.toString();
}

module.exports = { createProjectsTable, createWorkflowsTable, createWorkflowSchemesTable };