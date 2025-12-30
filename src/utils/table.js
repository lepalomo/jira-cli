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
        colWidths: [10, 30, 40, 30]
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

module.exports = {
    createProjectsTable,
    createWorkflowsTable,
    createWorkflowSchemesTable,
    createIssueTypeScreenSchemesTable,
    createIssueTypeSchemesTable,
    createIssueTypesTable,
    createScreenSchemesTable,
    createScreensTable
};