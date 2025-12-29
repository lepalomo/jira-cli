#!/usr/bin/env node

const { Command } = require('commander');
const { loadConfig, saveConfig } = require('./srccommands/config');
const { listProjects, listCategories, archiveProject, archiveProjects, updateProjectName, updateProjectCategory, updateProjectsCategory, listProjectsByCategory, deleteProjects, listWorkflows, deleteWorkflows, listWorkflowSchemes, cleanupWorkflows } = require('./srccommands/projects-new');

const program = new Command();

program
    .name('jira-cli')
    .description('CLI for Jira API v3')
    .version('1.0.0');

program.command('set-config')
    .description('Set Jira configuration (URL, email, token)')
    .requiredOption('-u, --url <url>', 'Jira instance URL (e.g., https://yourcompany.atlassian.net)')
    .requiredOption('-e, --email <email>', 'Jira user email')
    .requiredOption('-t, --token <token>', 'Jira API token')
    .option('-l, --log-email <email>', 'Email para receber logs das operações (opcional)')
    .option('--smtp-user <user>', 'Email SMTP para envio (ex: seu-email@gmail.com)')
    .option('--smtp-pass <pass>', 'Senha de app do email SMTP')
    .action((options) => {
        saveConfig(options);
    });

program.command('list-projects')
    .description('List active projects in the Jira instance')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await listProjects(config);
        } catch (error) {
            console.error('Error fetching projects:', error.response ? error.response.data : error.message);
        }
    });

program.command('archive-project')
    .description('Archive a project')
    .requiredOption('-k, --key <key>', 'Project key')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await archiveProject(config, options.key);
        } catch (error) {
            console.error('Error archiving project:', error.response ? error.response.data : error.message);
        }
    });

program.command('update-project-name')
    .description('Update project name')
    .requiredOption('-k, --key <key>', 'Project key')
    .requiredOption('-n, --name <name>', 'New project name')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await updateProjectName(config, options.key, options.name);
        } catch (error) {
            console.error('Error updating project name:', error.response ? error.response.data : error.message);
        }
    });

program.command('update-project-category')
    .description('Update project category')
    .requiredOption('-k, --key <key>', 'Project key')
    .requiredOption('-c, --category <categoryId>', 'Category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await updateProjectCategory(config, options.key, options.category);
        } catch (error) {
            console.error('Error updating project category:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-project-categories')
    .description('List available project categories')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await listCategories(config);
        } catch (error) {
            console.error('Error fetching categories:', error.response ? error.response.data : error.message);
        }
    });

program.command('archive-projects')
    .description('Archive multiple projects')
    .requiredOption('-k, --keys <keys>', 'Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await archiveProjects(config, projectKeys);
        } catch (error) {
            console.error('Error archiving projects:', error.response ? error.response.data : error.message);
        }
    });

program.command('update-projects-category')
    .description('Update category for multiple projects')
    .requiredOption('-k, --keys <keys>', 'Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3)')
    .requiredOption('-c, --category <categoryId>', 'Category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await updateProjectsCategory(config, projectKeys, options.category);
        } catch (error) {
            console.error('Error updating projects category:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-projects-by-category')
    .description('List projects by category')
    .requiredOption('-c, --category <categoryId>', 'Category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        try {
            await listProjectsByCategory(config, options.category);
        } catch (error) {
            console.error('Error fetching projects by category:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-projects')
    .description('Delete multiple projects')
    .requiredOption('-k, --keys <keys>', 'Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await deleteProjects(config, projectKeys);
        } catch (error) {
            console.error('Error deleting projects:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-workflows')
    .description('List workflows')
    .option('--active', 'List only active workflows')
    .option('--inactive', 'List only inactive workflows')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        if (options.active && options.inactive) {
            console.error('Cannot specify both --active and --inactive. Choose one.');
            return;
        }
        if (!options.active && !options.inactive) {
            console.error('Must specify either --active or --inactive.');
            return;
        }
        const isActive = options.active ? true : false;
        try {
            await listWorkflows(config, isActive);
        } catch (error) {
            console.error('Error fetching workflows:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-workflows')
    .description('Delete multiple workflows')
    .requiredOption('-i, --ids <ids>', 'Workflow IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const workflowIds = options.ids.split(',').map(id => id.trim());
        try {
            await deleteWorkflows(config, workflowIds);
        } catch (error) {
            console.error('Error deleting workflows:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-workflow-schemes')
    .description('List workflow schemes')
    .option('--active', 'List only active workflow schemes')
    .option('--inactive', 'List only inactive workflow schemes')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        let isActive = null;
        if (options.active) isActive = true;
        if (options.inactive) isActive = false;
        try {
            await listWorkflowSchemes(config, isActive);
        } catch (error) {
            console.error('Error fetching workflow schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('cleanup')
    .description('Limpeza de recursos do Jira')
    .option('--workflows', 'Limpar workflows inativos sem esquemas')
    .option('--exec', 'Executar a limpeza (sem esta opção apenas lista os itens)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        if (!options.workflows) {
            console.error('Especifique o tipo de limpeza: --workflows');
            return;
        }
        try {
            if (options.workflows) {
                await cleanupWorkflows(config, options.exec);
            }
        } catch (error) {
            console.error('Error during cleanup:', error.response ? error.response.data : error.message);
        }
    });

program.command('set-email-logs')
    .description('Configurar email para logs (opcional)')
    .requiredOption('-l, --log-email <email>', 'Email para receber logs das operações')
    .requiredOption('--smtp-user <user>', 'Email SMTP para envio (ex: seu-email@gmail.com)')
    .requiredOption('--smtp-pass <pass>', 'Senha de app do email SMTP')
    .action((options) => {
        const config = loadConfig();
        config.logEmail = options.logEmail;
        config.smtpUser = options.smtpUser;
        config.smtpPass = options.smtpPass;
        saveConfig(config);
        console.log('Configuração de email salva com sucesso.');
    });

program.parse();