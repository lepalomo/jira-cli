# Jira CLI

A command-line interface tool to interact with Jira API v3.

## Quick Start

1. **Set your Jira credentials**:
   ```bash
   jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token
   ```

2. **List your projects**:
   ```bash
   jira-cli list-projects
   ```

3. **Get help**:
   ```bash
   jira-cli --help
   ```

## Usage

### Set Configuration

First, set your Jira credentials (do this once):

```bash
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token
```

Optional flags for email logging (can be set later with `set-email-logs`):

```bash
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token -l logs@example.com --smtp-user smtp-user@example.com --smtp-pass your-smtp-password
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

## Commands Reference

All commands that interact with Jira accept optional `-u`, `-e`, `-t` flags to override the saved configuration for a single execution.

### Set Email Logging

#### `set-email-logs`
Configure email for operation logs.

**Options:**
- `-l, --log-email <email>`: Email to receive operation logs (required)
- `--smtp-user <user>`: SMTP email for sending (e.g., your-email@gmail.com) (required)
- `--smtp-pass <pass>`: SMTP app password (required)

**Example:**
```bash
jira-cli set-email-logs -l logs@example.com --smtp-user smtp-user@example.com --smtp-pass your-smtp-password
```

### Project Category Related

#### `list-project-categories`
List available project categories.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-project-categories
```

#### `list-projects-by-category`
List projects filtered by category.

**Options:**
- `-c, --category <categoryId>`: Category ID (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-projects-by-category -c 10010
```

### Project Related

#### `list-projects`
Fetch and display active projects from Jira.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email  
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-projects
jira-cli list-projects -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `archive-project`
Archive a single project.

**Options:**
- `-k, --key <key>`: Project key (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli archive-project -k PROJ1
jira-cli archive-project -k PROJ2 -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `archive-projects`
Archive multiple projects.

**Options:**
- `-k, --keys <keys>`: Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3) (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli archive-projects -k PROJ1,PROJ2,PROJ3
```

#### `update-project-name`
Update a project's name.

**Options:**
- `-k, --key <key>`: Project key (required)
- `-n, --name <name>`: New project name (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli update-project-name -k PROJ1 -n "New Project Name"
```

#### `update-project-category`
Update a project's category.

**Options:**
- `-k, --key <key>`: Project key (required)
- `-c, --category <categoryId>`: Category ID (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli update-project-category -k PROJ1 -c 10010
```

#### `update-projects-category`
Update category for multiple projects.

**Options:**
- `-k, --keys <keys>`: Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3) (required)
- `-c, --category <categoryId>`: Category ID (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli update-projects-category -k PROJ1,PROJ2 -c 10010
```

#### `delete-projects`
Delete multiple projects.

**Options:**
- `-k, --keys <keys>`: Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3) (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli delete-projects -k PROJ1,PROJ2
```

### Workflow Scheme Related

#### `list-workflow-schemes`
List workflow schemes.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-workflow-schemes
jira-cli list-workflow-schemes -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-workflow-schemes`
Delete multiple workflow schemes. Use `--unused` to delete schemes not linked to any projects.

**Options:**
- `-i, --ids <ids>`: Workflow scheme IDs separated by comma (e.g., ID1,ID2,ID3)
- `--unused`: Delete all workflow schemes not linked to any projects
- `--exec`: Execute deletion (without this option, only preview what would be deleted)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--ids` or `--unused`, but not both.

**Examples:**

Delete specific workflow schemes:
```bash
jira-cli delete-workflow-schemes -i 201,202,203
```

Preview which unused workflow schemes would be deleted:
```bash
jira-cli delete-workflow-schemes --unused
```

Execute deletion of unused workflow schemes:
```bash
jira-cli delete-workflow-schemes --unused --exec
```

### Workflow Related

#### `list-workflows`
List workflows.

**Options:**
- `--active`: List only active workflows
- `--inactive`: List only inactive workflows
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--active` or `--inactive`.

**Example:**
```bash
jira-cli list-workflows --active
jira-cli list-workflows --inactive -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-workflows`
Delete multiple workflows. Use `--unused` to delete inactive workflows not linked to any schemes.

**Options:**
- `-i, --ids <ids>`: Workflow IDs separated by comma (e.g., ID1,ID2,ID3)
- `--unused`: Delete all inactive workflows not linked to any schemes
- `--exec`: Execute deletion (without this option, only preview what would be deleted)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--ids` or `--unused`, but not both.

**Examples:**

Delete specific workflows:
```bash
jira-cli delete-workflows -i 101,102,103
```

Preview which unused workflows would be deleted:
```bash
jira-cli delete-workflows --unused
```

Execute deletion of unused workflows:
```bash
jira-cli delete-workflows --unused --exec
```

### Issue Type Related

#### `list-issue-type-screen-schemes`
List issue type screen schemes.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-issue-type-screen-schemes
jira-cli list-issue-type-screen-schemes -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-issue-type-screen-schemes`
Delete multiple issue type screen schemes. Use `--unused` to delete schemes not linked to any projects.

**Options:**
- `-i, --ids <ids>`: Issue type screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)
- `--unused`: Delete all issue type screen schemes not linked to any projects
- `--exec`: Execute deletion (without this option, only preview what would be deleted)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--ids` or `--unused`, but not both.

**Examples:**

Delete specific issue type screen schemes:
```bash
jira-cli delete-issue-type-screen-schemes -i 301,302,303
```

Preview which unused issue type screen schemes would be deleted:
```bash
jira-cli delete-issue-type-screen-schemes --unused
```

Execute deletion of unused issue type screen schemes:
```bash
jira-cli delete-issue-type-screen-schemes --unused --exec
```

#### `list-issue-type-schemes`
List issue type schemes.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-issue-type-schemes
jira-cli list-issue-type-schemes -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-issue-type-schemes`
Delete multiple issue type schemes. Use `--unused` to delete schemes not linked to any projects AND any issue types.

**Options:**
- `-i, --ids <ids>`: Issue type scheme IDs separated by comma (e.g., ID1,ID2,ID3)
- `--unused`: Delete all issue type schemes not linked to any projects AND any issue types
- `--exec`: Execute deletion (without this option, only preview what would be deleted)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--ids` or `--unused`, but not both.

**Examples:**

Delete specific issue type schemes:
```bash
jira-cli delete-issue-type-schemes -i 401,402,403
```

Preview which unused issue type schemes would be deleted:
```bash
jira-cli delete-issue-type-schemes --unused
```

Execute deletion of unused issue type schemes:
```bash
jira-cli delete-issue-type-schemes --unused --exec
```

#### `list-issue-types`
List issue types.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-issue-types
jira-cli list-issue-types -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-issue-types`
Delete multiple issue types.

**Options:**
- `-i, --ids <ids>`: Issue type IDs separated by comma (e.g., ID1,ID2,ID3) (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli delete-issue-types -i 501,502,503
```

### Screen Related

#### `list-screen-schemes`
List screen schemes.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-screen-schemes
jira-cli list-screen-schemes -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-screen-schemes`
Delete multiple screen schemes. Use `--unused` to delete schemes not linked to any issue type screen schemes.

**Options:**
- `-i, --ids <ids>`: Screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)
- `--unused`: Delete all screen schemes not linked to any issue type screen schemes
- `--exec`: Execute deletion (without this option, only preview what would be deleted)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify either `--ids` or `--unused`, but not both.

**Examples:**

Delete specific screen schemes:
```bash
jira-cli delete-screen-schemes -i 601,602,603
```

Preview which unused screen schemes would be deleted:
```bash
jira-cli delete-screen-schemes --unused
```

Execute deletion of unused screen schemes:
```bash
jira-cli delete-screen-schemes --unused --exec
```

#### `list-screens`
List screens.

**Options:**
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli list-screens
jira-cli list-screens -u https://test.atlassian.net -e test@example.com -t abc123
```

#### `delete-screens`
Delete multiple screens.

**Options:**
- `-i, --ids <ids>`: Screen IDs separated by comma (e.g., ID1,ID2,ID3) (required)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Example:**
```bash
jira-cli delete-screens -i 701,702,703
```

### Cleanup Operations

#### `cleanup`
Clean up unused resources. Use `--complete` for sequential cleanup of all resources.

**Options:**
- `--complete`: Complete sequential cleanup: archived projects, workflow schemes, workflows, issue type screen schemes, issue type schemes, screen schemes, screens
- `--workflows`: Clean up inactive workflows without schemes
- `--workflow-schemes`: Clean up inactive workflow schemes
- `--wf-schemes`: Alias for `--workflow-schemes`
- `--exec`: Execute the cleanup (without this option only lists the items)
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email
- `-t, --token <token>`: Jira API token

**Note:** You must specify at least one of `--complete`, `--workflows`, or `--workflow-schemes` (or `--wf-schemes`).

**Examples:**

Preview which workflows would be deleted:
```bash
jira-cli cleanup --workflows
```

Preview which workflow schemes would be deleted:
```bash
jira-cli cleanup --workflow-schemes
```

Execute cleanup of workflows:
```bash
jira-cli cleanup --workflows --exec
```

Execute cleanup of both workflows and workflow schemes:
```bash
jira-cli cleanup --workflows --workflow-schemes --exec
```

Preview complete sequential cleanup:
```bash
jira-cli cleanup --complete
```

Execute complete sequential cleanup:
```bash
jira-cli cleanup --complete --exec
```

## Advanced Usage

### Timeout Configuration

All operations in the Jira CLI are protected by a 120-second (2-minute) timeout. This prevents commands from hanging indefinitely due to network issues or slow Jira API responses.

**Features:**
- **HTTP Request Timeout**: All axios HTTP requests have a 120-second timeout configured
- **Command-Level Timeout**: All command functions are wrapped with a 120-second timeout
- **Graceful Error Handling**: Timeout errors provide descriptive messages indicating which operation timed out

**Timeout Error Example:**
```
Error: Operation "listProjects" timed out after 120 seconds
```

**Customization:**
The timeout duration can be adjusted by modifying the `timeout` property in the `JiraApi` constructor in `src/services/jiraApi.js` and the timeout value in `src/commands/commands.js`.

### Using Configuration Overrides

All Jira-interacting commands support temporary credential overrides:

```bash
jira-cli list-projects -u https://test.atlassian.net -e user@test.com -t token123
```

This is useful for:
- Testing with different Jira instances
- Running commands with different user permissions
- Temporary access without modifying saved configuration

### Email Logging Integration

When email logging is configured, operation summaries are sent for specific commands under certain conditions:

**Commands that send emails:**
- `cleanup` (only with `--exec` flag, preview mode does NOT send emails)
- `cleanup --complete` (only with `--exec` flag)

**Commands that do NOT send emails:**
- `archive-projects`
- `delete-projects`
- `delete-workflows` (including `--unused` mode)
- `delete-workflow-schemes` (including `--unused` mode)
- All other commands

**Email triggering conditions:**
- Emails are only sent during execution (when `--exec` flag is used)
- Preview modes (without `--exec`) do NOT send emails
- Emails include operation results, success/failure status, and error messages if any

**Email format:**
- Logs are sent as plain text with HTML `<pre>` tag formatting
- **Note for Outlook users:** The `<pre>` tag ensures proper formatting but may require plain text viewing for optimal display

**Log content includes:**
- Timestamp of operation
- Command executed
- Success/failure status for each item
- Error messages if any


## Supported Platforms

- **Windows**: PowerShell, Command Prompt, or WSL
- **Linux**: Any terminal with Bash/Zsh
- **macOS**: Terminal with Bash/Zsh
