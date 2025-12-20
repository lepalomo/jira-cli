# Jira CLI

A command-line interface tool to interact with Jira API v3.

## Installation

1. Clone or download this project.
2. Run `npm install` to install dependencies.
3. Run `npm link` to create a global symlink for the `jira-cli` command.

## Usage

### Set Configuration

First, set your Jira credentials:

```bash
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token
```

### List Projects

To list active projects:

```bash
jira-cli list-projects
```

You can also override the configuration for a single command:

```bash
jira-cli list-projects -u https://another-instance.atlassian.net -e another-email@example.com -t another-token
```

## Commands

- `set-config`: Save Jira URL, email, and API token to a local config file.
- `list-projects`: Fetch and display active projects from Jira.

## Requirements

- Node.js
- Jira API token (generate from your Jira account settings)