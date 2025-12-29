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

module.exports = { createProjectsTable };