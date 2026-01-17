#!/usr/bin/env node

const { Command } = require('commander');
const { loadConfig, saveConfig } = require('./src/commands/config');
const { validateConfig } = require('./src/utils/configCheck');
const { overrideHelpInformation } = require('./src/utils/helpFormatter');
const { getErrorMessage } = require('./src/utils/errorHandler');
const {
    listProjects, listCategories, archiveProject, archiveProjects, updateProjectName, updateProjectCategory,
    updateProjectsCategory, projectDetails, listProjectsByCategory, deleteProjects, listWorkflows, deleteWorkflows,
    deleteWorkflowSchemes, listWorkflowSchemes, cleanupWorkflows, cleanupWorkflowSchemes, cleanupComplete,
    listIssueTypeScreenSchemes, deleteIssueTypeScreenSchemes, listIssueTypeSchemes, deleteIssueTypeSchemes,
    listIssueTypes, deleteIssueTypes, listScreenSchemes, deleteScreenSchemes, listScreens, deleteScreens,
    listFields, getIssue, searchIssues, getIssuesBatch, setIssueFieldValue, setIssueFieldValueBatch,
    copyIssueFieldsValues, copyIssueFieldsValuesBatch, undoFieldOperation,
    listFieldConfigurationSchemes, assignFieldConfigurationScheme, assignFieldConfigurationSchemeToCategory,
    assignScreenScheme, assignScreenSchemeToCategory
} = require('./src/commands/commands');

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
    .option('-l, --log-email <email>', 'Email to receive operation logs (optional)')
    .option('--smtp-user <user>', 'SMTP email for sending (e.g., your-email@gmail.com)')
    .option('--smtp-pass <pass>', 'App password for SMTP email')
    .action((options) => {
        saveConfig(options);
    });

program.command('set-email-logs')
    .description('Configure email for logs (optional)')
    .requiredOption('-l, --log-email <email>', 'Email to receive operation logs')
    .requiredOption('--smtp-user <user>', 'SMTP email for sending (e.g., your-email@gmail.com)')
    .requiredOption('--smtp-pass <pass>', 'App password for SMTP email')
    .action((options) => {
        const config = loadConfig();
        config.logEmail = options.logEmail;
        config.smtpUser = options.smtpUser;
        config.smtpPass = options.smtpPass;
        saveConfig(config);
        console.log('Email configuration saved successfully.');
    });

program.command('list-project-categories')
    .description('List available project categories')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listCategories(config);
        } catch (error) {
            console.error('Error fetching categories:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        try {
            await listProjectsByCategory(config, options.category);
        } catch (error) {
            console.error('Error fetching projects by category:', getErrorMessage(error));
        }
    });

program.command('list-projects')
    .description('List active projects in the Jira instance')
    .option('-c, --category <categoryId>', 'Filter by project category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            if (options.category) {
                await listProjectsByCategory(config, options.category);
            } else {
                await listProjects(config);
            }
        } catch (error) {
            console.error('Error fetching projects:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        try {
            await archiveProject(config, options.key);
        } catch (error) {
            console.error('Error archiving project:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await archiveProjects(config, projectKeys);
        } catch (error) {
            console.error('Error archiving projects:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        try {
            await updateProjectName(config, options.key, options.name);
        } catch (error) {
            console.error('Error updating project name:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        try {
            await updateProjectCategory(config, options.key, options.category);
        } catch (error) {
            console.error('Error updating project category:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await updateProjectsCategory(config, projectKeys, options.category);
        } catch (error) {
            console.error('Error updating projects category:', getErrorMessage(error));
        }
    });

program.command('project-details')
    .description('Show detailed information about a project including boards and workflows')
    .requiredOption('-k, --key <key>', 'Project key')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await projectDetails(config, options.key);
        } catch (error) {
            console.error('Error fetching project details:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        const projectKeys = options.keys.split(',').map(key => key.trim());
        try {
            await deleteProjects(config, projectKeys);
        } catch (error) {
            console.error('Error deleting projects:', getErrorMessage(error));
        }
    });

program.command('list-workflow-schemes')
    .description('List workflow schemes')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listWorkflowSchemes(config);
        } catch (error) {
            console.error('Error fetching workflow schemes:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        
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
            console.error('Error deleting workflow schemes:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
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
            console.error('Error fetching workflows:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        
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
            console.error('Error deleting workflows:', getErrorMessage(error));
        }
    });

program.command('list-issue-type-screen-schemes')
    .description('List issue type screen schemes')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listIssueTypeScreenSchemes(config);
        } catch (error) {
            console.error('Error fetching issue type screen schemes:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        
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
            console.error('Error deleting issue type screen schemes:', getErrorMessage(error));
        }
    });

program.command('list-issue-type-schemes')
    .description('List issue type schemes')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listIssueTypeSchemes(config);
        } catch (error) {
            console.error('Error fetching issue type schemes:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        
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
            console.error('Error deleting issue type schemes:', getErrorMessage(error));
        }
    });

program.command('list-issue-types')
    .description('List issue types')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listIssueTypes(config);
        } catch (error) {
            console.error('Error fetching issue types:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        const issueTypeIds = options.ids.split(',').map(id => id.trim());
        try {
            await deleteIssueTypes(config, issueTypeIds);
        } catch (error) {
            console.error('Error deleting issue types:', getErrorMessage(error));
        }
    });

program.command('list-screen-schemes')
    .description('List screen schemes')
    .option('-c, --category <categoryId>', 'Filter by project category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        const apiOptions = {};
        if (options.category) {
            apiOptions.category = options.category;
        }
        
        try {
            await listScreenSchemes(config, apiOptions);
        } catch (error) {
            console.error('Error fetching screen schemes:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        
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
            console.error('Error deleting screen schemes:', getErrorMessage(error));
        }
    });

program.command('list-screens')
    .description('List screens')
    .option('-s, --screen-scheme-id <id>', 'Filter screens by screen scheme ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            await listScreens(config, options.screenSchemeId);
        } catch (error) {
            console.error('Error fetching screens:', getErrorMessage(error));
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
        if (!validateConfig(config)) return;
        const screenIds = options.ids.split(',').map(id => id.trim());
        try {
            await deleteScreens(config, screenIds);
        } catch (error) {
            console.error('Error deleting screens:', getErrorMessage(error));
        }
    });

program.command('list-fields')
    .description('List fields with pagination and filtering')
    .option('--start-at <startAt>', 'Page offset (default: 0)', '0')
    .option('--max-results <maxResults>', 'Items per page (default: 50)', '50')
    .option('--type <type>', 'Field types to search (custom, system) - comma separated')
    .option('--id <id>', 'IDs of custom fields to return or filter - comma separated')
    .option('--query <query>', 'Case-insensitive partial match with field names or descriptions')
    .option('--order-by <orderBy>', 'Order results by: contextsCount, lastUsed, name, screensCount (with +/- prefixes)')
    .option('--expand <expand>', 'Expand parameter')
    .option('--project-ids <projectIds>', 'Project IDs to filter - comma separated')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        // Parse array parameters
        const parsedOptions = {};
        if (options.startAt !== undefined) parsedOptions.startAt = parseInt(options.startAt);
        if (options.maxResults !== undefined) parsedOptions.maxResults = parseInt(options.maxResults);
        if (options.type) parsedOptions.type = options.type;
        if (options.id) parsedOptions.id = options.id;
        if (options.query) parsedOptions.query = options.query;
        if (options.orderBy) parsedOptions.orderBy = options.orderBy;
        if (options.expand) parsedOptions.expand = options.expand;
        if (options.projectIds) parsedOptions.projectIds = options.projectIds;
        
        try {
            await listFields(config, parsedOptions);
        } catch (error) {
            console.error('Error fetching fields:', getErrorMessage(error));
        }
    });

program.command('cleanup')
    .description('Jira resource cleanup. Use --complete for complete sequential cleanup of unused resources.')
    .option('--complete', 'Complete sequential cleanup: archived projects, workflow schemes, workflows, issue type screen schemes, issue type schemes, screen schemes, screens')
    .option('--workflows', 'Clean inactive workflows without schemes')
    .option('--workflow-schemes', 'Clean inactive workflow schemes')
    .option('--wf-schemes', 'Alias for --workflow-schemes')
    .option('--exec', 'Execute cleanup (without this option only lists items)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        const hasComplete = options.complete;
        const hasWorkflows = options.workflows;
        const hasSchemes = options['workflow-schemes'] || options['wf-schemes'];
        
        if (hasComplete) {
            // Execute complete cleanup
            try {
                await cleanupComplete(config, options.exec);
            } catch (error) {
                console.error('Error during complete cleanup:', getErrorMessage(error));
            }
            return;
        }
        
        if (!hasWorkflows && !hasSchemes) {
            console.error('Specify cleanup type: --workflows, --workflow-schemes (--wf-schemes) or --complete');
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
            console.error('Error during cleanup:', getErrorMessage(error));
        }
    });

// New issue commands
program.command('get-issue')
    .description('Get issue details by ID or key')
    .requiredOption('-i, --issue <issueIdOrKey>', 'Issue ID or key (e.g., PROJ-123 or 10001)')
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--expand <expand>', 'Comma-separated list of expansions')
    .option('--properties <properties>', 'Comma-separated list of properties to include')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const apiOptions = {};
            if (options.fields) apiOptions.fields = options.fields;
            if (options.expand) apiOptions.expand = options.expand;
            if (options.properties) apiOptions.properties = options.properties;
            
            await getIssue(config, options.issue, apiOptions);
        } catch (error) {
            console.error('Error fetching issue:', getErrorMessage(error));
        }
    });

program.command('search-issues')
    .description('Search issues using JQL')
    .requiredOption('-j, --jql <jql>', 'JQL query string')
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--expand <expand>', 'Comma-separated list of expansions')
    .option('--start-at <startAt>', 'Starting index for pagination (default: 0)', '0')
    .option('--max-results <maxResults>', 'Maximum number of results to return (default: 50)', '50')
    .option('--validate-query', 'Whether to validate the JQL query')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const apiOptions = {
                startAt: parseInt(options.startAt),
                maxResults: parseInt(options.maxResults)
            };
            if (options.fields) apiOptions.fields = options.fields;
            if (options.expand) apiOptions.expand = options.expand;
            if (options.validateQuery !== undefined) apiOptions.validateQuery = options.validateQuery;
            
            await searchIssues(config, options.jql, apiOptions);
        } catch (error) {
            console.error('Error searching issues:', getErrorMessage(error));
        }
    });

program.command('get-issues-batch')
    .description('Get multiple issues in batch')
    .requiredOption('-i, --issues <issues>', 'Issue IDs or keys separated by comma (e.g., PROJ-123,PROJ-124,10001)')
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--expand <expand>', 'Comma-separated list of expansions')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const issueIdsOrKeys = options.issues.split(',').map(id => id.trim());
            const apiOptions = {};
            if (options.fields) apiOptions.fields = options.fields;
            if (options.expand) apiOptions.expand = options.expand;
            
            await getIssuesBatch(config, issueIdsOrKeys, apiOptions);
        } catch (error) {
            console.error('Error fetching issues batch:', getErrorMessage(error));
        }
    });

program.command('set-issue-field-value')
    .description('Set field value on an issue')
    .requiredOption('-i, --issue <issueIdOrKey>', 'Issue ID or key')
    .requiredOption('-f, --field <fieldId>', 'Field ID (e.g., summary, description, customfield_10001)')
    .requiredOption('-v, --value <value>', 'New value for the field')
    .option('--append', 'Append to existing value instead of replacing')
    .option('--separator <separator>', 'Separator to use when appending (default: "\\n\\n")')
    .option('--exec', 'Execute the update (without this option, only preview what would be updated)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const apiOptions = {};
            if (options.append) apiOptions.append = true;
            if (options.separator) apiOptions.separator = options.separator;
            if (options.exec) apiOptions.exec = true;
            
            await setIssueFieldValue(config, options.issue, options.field, options.value, apiOptions);
        } catch (error) {
            console.error('Error setting field value:', getErrorMessage(error));
        }
    });

program.command('set-issue-field-value-batch')
    .description('Set field value on multiple issues')
    .requiredOption('-i, --issues <issues>', 'Issue IDs or keys separated by comma')
    .requiredOption('-f, --field <fieldId>', 'Field ID to update')
    .requiredOption('-v, --value <value>', 'New value for the field')
    .option('--append', 'Append to existing value instead of replacing')
    .option('--separator <separator>', 'Separator to use when appending (default: "\\n\\n")')
    .option('--exec', 'Execute the update (without this option, only preview what would be updated)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const issueIdsOrKeys = options.issues.split(',').map(id => id.trim());
            const apiOptions = {};
            if (options.append) apiOptions.append = true;
            if (options.separator) apiOptions.separator = options.separator;
            if (options.exec) apiOptions.exec = true;
            
            await setIssueFieldValueBatch(config, issueIdsOrKeys, options.field, options.value, apiOptions);
        } catch (error) {
            console.error('Error setting field values batch:', getErrorMessage(error));
        }
    });

program.command('copy-issue-fields-values')
    .description('Copy field value from one field to another within the same issue')
    .requiredOption('-i, --issue <issueIdOrKey>', 'Issue ID or key')
    .requiredOption('-s, --source-fields <sourceFields>', 'Source field IDs separated by comma')
    .requiredOption('-t, --target-field <targetFieldId>', 'Target field ID')
    .option('--append', 'Append to existing value instead of replacing')
    .option('--separator <separator>', 'Separator to use when appending (default: "\\n\\n")')
    .option('--field-separator <fieldSeparator>', 'Separator between multiple source fields (default: "\\n\\n")')
    .option('--exec', 'Execute the copy (without this option, only preview what would be copied)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        try {
            const sourceFields = options.sourceFields.split(',').map(field => field.trim());
            const apiOptions = {};
            if (options.append) apiOptions.append = true;
            if (options.separator) apiOptions.separator = options.separator;
            if (options.fieldSeparator) apiOptions.fieldSeparator = options.fieldSeparator;
            if (options.exec) apiOptions.exec = true;
            
            await copyIssueFieldsValues(config, options.issue, sourceFields, options.targetField, apiOptions);
        } catch (error) {
            console.error('Error copying field values:', getErrorMessage(error));
        }
    });

program.command('copy-issue-fields-values-batch')
    .description('Copy field values for multiple issues with performance optimizations')
    .option('-i, --issues <issues>', 'Issue IDs or keys separated by comma')
    .option('-j, --jql <jql>', 'JQL query to find issues')
    .requiredOption('-s, --source-fields <sourceFields>', 'Source field IDs separated by comma')
    .requiredOption('-t, --target-field <targetFieldId>', 'Target field ID')
    .option('--append', 'Append to existing value instead of replacing')
    .option('--separator <separator>', 'Separator to use when appending (default: "\\n\\n")')
    .option('--field-separator <fieldSeparator>', 'Separator between multiple source fields (default: "\\n\\n")')
    .option('--batch-size <batchSize>', 'Number of issues to process in parallel (default: 10)', '10')
    .option('--chunk-size <chunkSize>', 'Number of issues to process per chunk (default: 100)', '100')
    .option('--exec', 'Execute the copy (without this option, only preview what would be copied)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        if (!options.issues && !options.jql) {
            console.error('Must specify either --issues or --jql.');
            return;
        }
        
        if (options.issues && options.jql) {
            console.error('Cannot specify both --issues and --jql. Choose one.');
            return;
        }
        
        try {
            let issueIdsOrKeys;
            
            if (options.issues) {
                issueIdsOrKeys = options.issues.split(',').map(id => id.trim());
            }
            
            const sourceFields = options.sourceFields.split(',').map(field => field.trim());
            const apiOptions = {
                batchSize: parseInt(options.batchSize),
                chunkSize: parseInt(options.chunkSize)
            };
            
            if (options.jql) apiOptions.jql = options.jql;
            if (options.append) apiOptions.append = true;
            if (options.separator) apiOptions.separator = options.separator;
            if (options.fieldSeparator) apiOptions.fieldSeparator = options.fieldSeparator;
            if (options.exec) apiOptions.exec = true;
            
            await copyIssueFieldsValuesBatch(config, issueIdsOrKeys, sourceFields, options.targetField, apiOptions);
        } catch (error) {
            console.error('Error copying field values batch:', getErrorMessage(error));
        }
    });

program.command('undo-field-operation')
    .description('Undo field operation by analyzing changelog')
    .option('-j, --jql <jql>', 'JQL query to find the issues that were modified')
    .option('-i, --issues <issues>', 'Issue IDs or keys separated by comma (e.g., PROJ-123,PROJ-124)')
    .option('-o, --operation-id <operationId>', 'Batch operation ID to find issues modified by that operation')
    .option('--issue-operation-id <issueOperationId>', 'Issue operation ID to find specific issue modified by that operation')
    .requiredOption('-t, --target-field <fieldId>', 'Field ID that was modified and needs to be reverted')
    .option('--exec', 'Execute the undo operation (without this option, only preview what would be undone)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('--token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        const searchOptions = [options.jql, options.issues, options.operationId, options.issueOperationId].filter(Boolean);
        if (searchOptions.length === 0) {
            console.error('Must specify one of: --jql, --issues, --operation-id, or --issue-operation-id.');
            return;
        }
        
        if (searchOptions.length > 1) {
            console.error('Cannot specify multiple search methods. Choose one: --jql, --issues, --operation-id, or --issue-operation-id.');
            return;
        }
        
        try {
            const apiOptions = {
                targetField: options.targetField,
                exec: options.exec || false
            };
            
            if (options.jql) {
                apiOptions.jql = options.jql;
            } else if (options.issues) {
                apiOptions.issues = options.issues.split(',').map(id => id.trim());
            } else if (options.operationId) {
                apiOptions.operationId = options.operationId;
            } else if (options.issueOperationId) {
                apiOptions.issueOperationId = options.issueOperationId;
            }
            
            await undoFieldOperation(config, apiOptions);
        } catch (error) {
            console.error('Error undoing field operation:', getErrorMessage(error));
        }
    });

// Field configuration scheme commands
program.command('list-field-configuration-schemes')
    .description('List field configuration schemes and their project associations')
    .option('--start-at <startAt>', 'Page offset (default: 0)', '0')
    .option('--max-results <maxResults>', 'Items per page (default: 50)', '50')
    .option('-k, --keys <keys>', 'Filter by project ID or key (comma-separated for multiple)')
    .option('-c, --category <categoryId>', 'Filter by project category ID')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        const apiOptions = {};
        if (options.startAt !== undefined) apiOptions.startAt = parseInt(options.startAt);
        if (options.maxResults !== undefined) apiOptions.maxResults = parseInt(options.maxResults);
        if (options.keys) {
            // Split comma-separated project IDs/keys into an array
            apiOptions.projectId = options.keys.split(',').map(id => id.trim());
        }
        if (options.category) {
            apiOptions.category = options.category;
        }
        
        try {
            await listFieldConfigurationSchemes(config, apiOptions);
        } catch (error) {
            console.error('Error fetching field configuration schemes:', getErrorMessage(error));
        }
    });

program.command('assign-field-configuration-scheme')
    .description('Assign a field configuration scheme to one or more projects')
    .option('-k, --keys <keys>', 'Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3)')
    .option('-c, --category <categoryId>', 'Category ID (assign to all projects in category)')
    .option('-s, --scheme-id <schemeId>', 'Field configuration scheme ID (omit to assign default scheme)')
    .option('--exec', 'Execute assignment (without this option, only preview what would be assigned)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        if (!options.keys && !options.category) {
            console.error('Must specify either --keys or --category.');
            return;
        }
        
        if (options.keys && options.category) {
            console.error('Cannot specify both --keys and --category. Choose one.');
            return;
        }
        
        const apiOptions = {};
        if (options.exec) apiOptions.exec = true;
        
        try {
            if (options.category) {
                await assignFieldConfigurationSchemeToCategory(config, options.category, options.schemeId, apiOptions);
            } else {
                const projectKeys = options.keys.split(',').map(key => key.trim());
                await assignFieldConfigurationScheme(config, projectKeys, options.schemeId, apiOptions);
            }
        } catch (error) {
            console.error('Error assigning field configuration scheme:', getErrorMessage(error));
        }
    });

program.command('assign-screen-scheme')
    .description('Assign a screen scheme to one or more projects')
    .option('-k, --keys <keys>', 'Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3)')
    .option('-c, --category <categoryId>', 'Category ID (assign to all projects in category)')
    .option('-s, --scheme-id <schemeId>', 'Screen scheme ID (omit to assign default scheme)')
    .option('--exec', 'Execute assignment (without this option, only preview what would be assigned)')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = { ...loadConfig(), ...options };
        if (!validateConfig(config)) return;
        
        if (!options.keys && !options.category) {
            console.error('Must specify either --keys or --category.');
            return;
        }
        
        if (options.keys && options.category) {
            console.error('Cannot specify both --keys and --category. Choose one.');
            return;
        }
        
        const apiOptions = {};
        if (options.exec) apiOptions.exec = true;
        
        try {
            if (options.category) {
                await assignScreenSchemeToCategory(config, options.category, options.schemeId, apiOptions);
            } else {
                const projectKeys = options.keys.split(',').map(key => key.trim());
                await assignScreenScheme(config, projectKeys, options.schemeId, apiOptions);
            }
        } catch (error) {
            console.error('Error assigning screen scheme:', getErrorMessage(error));
        }
    });


// Override help information to show categorized commands
overrideHelpInformation(program);

program.parse();