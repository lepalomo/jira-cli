#!/usr/bin/env node

const { Command } = require('commander');
const { loadConfig, saveConfig } = require('./src/commands/config');
const { listProjects, listCategories, archiveProject, archiveProjects, updateProjectName, updateProjectCategory, updateProjectsCategory, listProjectsByCategory, deleteProjects, listWorkflows, deleteWorkflows, deleteWorkflowSchemes, listWorkflowSchemes, cleanupWorkflows, cleanupWorkflowSchemes, cleanupComplete, listIssueTypeScreenSchemes, deleteIssueTypeScreenSchemes, listIssueTypeSchemes, deleteIssueTypeSchemes, listIssueTypes, deleteIssueTypes, listScreenSchemes, deleteScreenSchemes, listScreens, deleteScreens } = require('./src/commands/commands');

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

program.command('list-workflow-schemes')
    .description('List workflow schemes')
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
            await listWorkflowSchemes(config);
        } catch (error) {
            console.error('Error fetching workflow schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-workflow-schemes')
    .description('Delete multiple workflow schemes. Use --unused to delete schemes not linked to any projects')
    .option('-i, --ids <ids>', 'Workflow scheme IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('--unused', 'Delete all workflow schemes not linked to any projects')
    .option('--exec', 'Execute deletion (without this option, only preview what would be deleted)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        
        if (options.unused && options.ids) {
            console.error('Cannot specify both --ids and --unused. Choose one.');
            return;
        }
        
        if (!options.unused && !options.ids) {
            console.error('Must specify either --ids or --unused.');
            return;
        }
        
        try {
            if (options.unused) {
                await deleteWorkflowSchemes(config, [], { unused: true, exec: options.exec });
            } else {
                const schemeIds = options.ids.split(',').map(id => id.trim());
                await deleteWorkflowSchemes(config, schemeIds, { unused: false, exec: false });
            }
        } catch (error) {
            console.error('Error deleting workflow schemes:', error.response ? error.response.data : error.message);
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
    .description('Delete multiple workflows. Use --unused to delete inactive workflows not linked to any schemes')
    .option('-i, --ids <ids>', 'Workflow IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('--unused', 'Delete all inactive workflows not linked to any schemes')
    .option('--exec', 'Execute deletion (without this option, only preview what would be deleted)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        
        if (options.unused && options.ids) {
            console.error('Cannot specify both --ids and --unused. Choose one.');
            return;
        }
        
        if (!options.unused && !options.ids) {
            console.error('Must specify either --ids or --unused.');
            return;
        }
        
        try {
            if (options.unused) {
                await deleteWorkflows(config, [], { unused: true, exec: options.exec });
            } else {
                const workflowIds = options.ids.split(',').map(id => id.trim());
                await deleteWorkflows(config, workflowIds, { unused: false, exec: false });
            }
        } catch (error) {
            console.error('Error deleting workflows:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-issue-type-screen-schemes')
    .description('List issue type screen schemes')
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
            await listIssueTypeScreenSchemes(config);
        } catch (error) {
            console.error('Error fetching issue type screen schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-issue-type-screen-schemes')
    .description('Delete multiple issue type screen schemes. Use --unused to delete schemes not linked to any projects')
    .option('-i, --ids <ids>', 'Issue type screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('--unused', 'Delete all issue type screen schemes not linked to any projects')
    .option('--exec', 'Execute deletion (without this option, only preview what would be deleted)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        
        if (options.unused && options.ids) {
            console.error('Cannot specify both --ids and --unused. Choose one.');
            return;
        }
        
        if (!options.unused && !options.ids) {
            console.error('Must specify either --ids or --unused.');
            return;
        }
        
        try {
            if (options.unused) {
                await deleteIssueTypeScreenSchemes(config, [], { unused: true, exec: options.exec });
            } else {
                const schemeIds = options.ids.split(',').map(id => id.trim());
                await deleteIssueTypeScreenSchemes(config, schemeIds, { unused: false, exec: false });
            }
        } catch (error) {
            console.error('Error deleting issue type screen schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-issue-type-schemes')
    .description('List issue type schemes')
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
            await listIssueTypeSchemes(config);
        } catch (error) {
            console.error('Error fetching issue type schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-issue-type-schemes')
    .description('Delete multiple issue type schemes. Use --unused to delete schemes not linked to any projects AND any issue types')
    .option('-i, --ids <ids>', 'Issue type scheme IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('--unused', 'Delete all issue type schemes not linked to any projects AND any issue types')
    .option('--exec', 'Execute deletion (without this option, only preview what would be deleted)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        
        if (options.unused && options.ids) {
            console.error('Cannot specify both --ids and --unused. Choose one.');
            return;
        }
        
        if (!options.unused && !options.ids) {
            console.error('Must specify either --ids or --unused.');
            return;
        }
        
        try {
            if (options.unused) {
                await deleteIssueTypeSchemes(config, [], { unused: true, exec: options.exec });
            } else {
                const schemeIds = options.ids.split(',').map(id => id.trim());
                await deleteIssueTypeSchemes(config, schemeIds, { unused: false, exec: false });
            }
        } catch (error) {
            console.error('Error deleting issue type schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-issue-types')
    .description('List issue types')
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
            await listIssueTypes(config);
        } catch (error) {
            console.error('Error fetching issue types:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-issue-types')
    .description('Delete multiple issue types')
    .requiredOption('-i, --ids <ids>', 'Issue type IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const issueTypeIds = options.ids.split(',').map(id => id.trim());
        try {
            await deleteIssueTypes(config, issueTypeIds);
        } catch (error) {
            console.error('Error deleting issue types:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-screen-schemes')
    .description('List screen schemes')
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
            await listScreenSchemes(config);
        } catch (error) {
            console.error('Error fetching screen schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-screen-schemes')
    .description('Delete multiple screen schemes. Use --unused to delete schemes not linked to any issue type screen schemes')
    .option('-i, --ids <ids>', 'Screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('--unused', 'Delete all screen schemes not linked to any issue type screen schemes')
    .option('--exec', 'Execute deletion (without this option, only preview what would be deleted)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        
        if (options.unused && options.ids) {
            console.error('Cannot specify both --ids and --unused. Choose one.');
            return;
        }
        
        if (!options.unused && !options.ids) {
            console.error('Must specify either --ids or --unused.');
            return;
        }
        
        try {
            if (options.unused) {
                await deleteScreenSchemes(config, [], { unused: true, exec: options.exec });
            } else {
                const schemeIds = options.ids.split(',').map(id => id.trim());
                await deleteScreenSchemes(config, schemeIds, { unused: false, exec: false });
            }
        } catch (error) {
            console.error('Error deleting screen schemes:', error.response ? error.response.data : error.message);
        }
    });

program.command('list-screens')
    .description('List screens')
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
            await listScreens(config);
        } catch (error) {
            console.error('Error fetching screens:', error.response ? error.response.data : error.message);
        }
    });

program.command('delete-screens')
    .description('Delete multiple screens')
    .requiredOption('-i, --ids <ids>', 'Screen IDs separated by comma (e.g., ID1,ID2,ID3)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!config.url || !config.email || !config.token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const screenIds = options.ids.split(',').map(id => id.trim());
        try {
            await deleteScreens(config, screenIds);
        } catch (error) {
            console.error('Error deleting screens:', error.response ? error.response.data : error.message);
        }
    });

program.command('cleanup')
    .description('Limpeza de recursos do Jira. Use --complete para limpeza completa sequencial de recursos não utilizados.')
    .option('--complete', 'Limpeza completa sequencial: projetos arquivados, workflow schemes, workflows, issue type screen schemes, issue type schemes, screen schemes, screens')
    .option('--workflows', 'Limpar workflows inativos sem esquemas')
    .option('--workflow-schemes', 'Limpar workflow schemes inativos')
    .option('--wf-schemes', 'Alias para --workflow-schemes')
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
        const hasComplete = options.complete;
        const hasWorkflows = options.workflows;
        const hasSchemes = options['workflow-schemes'] || options['wf-schemes'];
        
        if (hasComplete) {
            // Execute complete cleanup
            try {
                await cleanupComplete(config, options.exec);
            } catch (error) {
                console.error('Error during complete cleanup:', error.response ? error.response.data : error.message);
            }
            return;
        }
        
        if (!hasWorkflows && !hasSchemes) {
            console.error('Especifique o tipo de limpeza: --workflows, --workflow-schemes (--wf-schemes) ou --complete');
            return;
        }
        try {
            if (hasWorkflows) {
                await cleanupWorkflows(config, options.exec);
            }
            if (hasSchemes) {
                await cleanupWorkflowSchemes(config, options.exec);
            }
        } catch (error) {
            console.error('Error during cleanup:', error.response ? error.response.data : error.message);
        }
    });

program.parse();