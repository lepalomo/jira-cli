#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');

function loadConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {};
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

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
    .action((options) => {
        saveConfig(options);
        console.log('Configuration saved.');
    });

program.command('list-projects')
    .description('List active projects in the Jira instance')
    .option('-u, --url <url>', 'Jira instance URL')
    .option('-e, --email <email>', 'Jira user email')
    .option('-t, --token <token>', 'Jira API token')
    .action(async (options) => {
        const config = loadConfig();
        const url = options.url || config.url;
        const email = options.email || config.email;
        const token = options.token || config.token;
        if (!url || !email || !token) {
            console.error('Missing configuration. Use "set-config" to save credentials or provide options.');
            return;
        }
        const auth = Buffer.from(`${email}:${token}`).toString('base64');
        try {
            const response = await axios.get(`${url}/rest/api/3/project`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error('Error fetching projects:', error.response ? error.response.data : error.message);
        }
    });

program.parse();