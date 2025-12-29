const JiraApi = require('../srcservices/jiraApi');
const { createProjectsTable } = require('../srcutils/table');

async function listProjects(config) {
    const jira = new JiraApi(config.url, config.email, config.token);
    const projects = await jira.listProjects();
    console.log(createProjectsTable(projects));
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

module.exports = {
    listProjects,
    archiveProject,
    updateProjectName,
    updateProjectCategory
};