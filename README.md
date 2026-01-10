# 🎉 Jira CLI - Your Friendly Jira Assistant

![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green)
![Jira API v3](https://img.shields.io/badge/Jira%20API-v3-blue)
![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

---

## ✨ What is Jira CLI?

**Jira CLI** is your friendly command-line companion for managing Jira instances with ease! Whether you're a Jira administrator, project manager, or developer, this tool helps you automate common tasks without ever leaving your terminal.

### 🎯 Key Benefits
- **⚡ Speed**: Execute batch operations in seconds instead of hours
- **🔒 Security**: Keep your credentials safe with local configuration
- **📊 Visibility**: Get clear, formatted output for all operations
- **🤖 Automation**: Script repetitive Jira management tasks
- **📧 Notifications**: Receive email summaries of important operations

### 👥 Who's it for?
- **Jira Administrators** managing multiple projects
- **Anyone tired of clicking through the Jira UI!**

---

## 🚀 Quick Start Guide

Get up and running in **under 5 minutes**! Just follow these simple steps:

1. **📥 Choose your installation path** (Windows EXE or Terminal)
2. **🔐 Configure your Jira credentials**
3. **🎯 Run your first command**

```
┌─────────────────────────────────────────────┐
│          How do you want to install?        │
├─────────────────────────────────────────────┤
│                                             │
│  🪟 Windows User in a Hurry?                |
│  ↓ Download the pre-built EXE               │
│                                             │
│  🐧 Linux/macOS User or Prefer Terminal?    │
│  ↓ Clone & Install via npm                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📥 Choose Your Installation Path

### 🪟 Path A: Quick Windows EXE Download
**Perfect for Windows users who want the fastest setup!**

```
╔══════════════════════════════════════════════╗
║          🪟 WINDOWS QUICK PATH              ║
║  Download → Run → Configure → Use!          ║
╚══════════════════════════════════════════════╝
```

#### Step-by-Step Instructions:
1. **Download** the pre-built `jira-cli.exe` from the /dist directory
2. **Place** the executable in a directory of your choice
   - Example: `C:\Users\YourName\
3. **Open** Command Prompt or PowerShell as an admin
4. **Verify** installation by running:
   ```bash
   jira-cli.exe --help
   ```

#### 🛠️ Windows Troubleshooting Tips:
- **"Command not found"**: Make sure the EXE directory is in your PATH
- **Permission denied**: Run as Administrator or adjust security settings
- **Antivirus warning**: Add an exception for the executable

### 🐧 Path B: Standard Terminal Installation
**For Linux, macOS, or advanced Windows users who prefer the terminal**

```
╔══════════════════════════════════════════════╗
║          🐧 TERMINAL USER PATH              ║
║  Clone → Install → Link → Use!              ║
╚══════════════════════════════════════════════╝
```

#### Prerequisites:
- **Node.js 18+** ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **git** ([Download here](https://git-scm.com/))

#### Step-by-Step Instructions:
1. **Clone** the repository:
   ```bash
   git clone https://github.com/yourusername/jira-cli.git
   cd jira-cli
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Link** globally (so you can run `jira-cli` from anywhere):
   ```bash
   npm link
   ```

4. **Verify** installation:
   ```bash
   jira-cli --help
   ```

🎉 **Congratulations!** You're ready to start using Jira CLI!

---

## ⚡ Your First 5 Minutes with Jira CLI

Let's get you connected to Jira and run your first command!

### Step 1: 🔐 Connect to Your Jira Instance
```bash
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token
```

**💡 Pro Tip**: Need help finding your API token? [Check Atlassian's guide](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)

### Step 2: 📋 See Your Projects
```bash
jira-cli list-projects
```

### Step 3: 🎉 Celebrate!
You should see a beautiful table of all your Jira projects! If you do, give yourself a pat on the back - you've successfully installed and configured Jira CLI!

---

## 🔧 Configuration Made Easy

### 📁 Where Configuration Lives
Your Jira credentials are stored securely in a local JSON file:
- **Location**: `~/.jira-cli/config.json` (or `%USERPROFILE%\.jira-cli\config.json` on Windows)
- **Format**: Encrypted credentials for security
- **Backup**: You can copy this file between machines

### 🔐 Security Best Practices
- **Never commit** your `config.json` to version control
- **Use environment variables** for CI/CD pipelines
- **Rotate API tokens** regularly
- **Store backups** in a password manager

### 🌐 Multiple Jira Instances
Need to work with multiple Jira instances? No problem! Use command-line overrides:
```bash
jira-cli list-projects -u https://test.atlassian.net -e test@example.com -t test-token
```

---

## 📚 Command Reference (Friendly Format)

Commands are grouped by purpose to help you find what you need quickly!

### 🏗️ Project Management
Commands for managing Jira projects

#### 🔍 `list-projects`
**What it does**: Shows all active projects in your Jira instance
**When to use**: When you need to see what projects are available
**Example**:
```bash
jira-cli list-projects
jira-cli list-projects -u https://test.atlassian.net
```

#### 📦 `archive-project`
**What it does**: Safely archives a single project
**When to use**: When a project is no longer active but you want to keep its data
**Options**:
    **-k, --key <key>**: Project key (required)
**Example**:
```bash
jira-cli archive-project -k PROJ1
```

#### 📦 `archive-projects`
**What it does**: Archives multiple projects at once
**When to use**: Batch cleanup of inactive projects
**Options**:
    **-k, --keys <keys>**: Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3) (required)
**Example**:
```bash
jira-cli archive-projects -k PROJ1,PROJ2,PROJ3
```

#### ✏️ `update-project-name`
**What it does**: Changes a project's display name
**When to use**: When projects need rebranding or correction
**Options**:
    **-k, --key <key>**: Project key (required)
    **-n, --name <name>**: New project name (required)
**Example**:
```bash
jira-cli update-project-name -k PROJ1 -n "New Project Name"
```

#### 🗂️ `update-project-category`
**What it does**: Updates a project's category
**When to use**: When reorganizing projects into different categories
**Options**:
    **-k, --key <key>**: Project key (required)
    **-c, --category <categoryId>**: Category ID (required)
**Example**:
```bash
jira-cli update-project-category -k PROJ1 -c 10010
```

#### 📋 `list-project-categories`
**What it does**: Shows all available project categories
**When to use**: When you need to find category IDs for organizing projects
**Example**:
```bash
jira-cli list-project-categories
```

#### 🔍 `list-projects-by-category`
**What it does**: Lists projects filtered by a specific category
**When to use**: When you want to see all projects in a particular category
**Options**:
    **-c, --category <categoryId>**: Category ID (required)
**Example**:
```bash
jira-cli list-projects-by-category -c 10010
```

#### 🗂️ `update-projects-category`
**What it does**: Updates category for multiple projects at once
**When to use**: When moving multiple projects to a new category
**Options**:
    **-k, --keys <keys>**: Project keys separated by comma (e.g., PROJ1,PROJ2,PROJ3) (required)
    **-c, --category <categoryId>**: Category ID (required)
**Example**:
```bash
jira-cli update-projects-category -k PROJ1,PROJ2,PROJ3 -c 10010
```

#### 🗑️ `delete-projects`
**What it does**: Permanently deletes multiple projects
**When to use**: **Use with caution!** Only for projects that truly need removal
**Options**:
    **-k, --keys <keys>**: Project keys separated by comma (e.g., PROJ1,PROJ2) (required)
**Example**:
```bash
jira-cli delete-projects -k PROJ1,PROJ2
```

### 📊 Workflow Operations
Commands for managing workflows and schemes

#### 🔄 `list-workflow-schemes`
**What it does**: Shows all workflow schemes
**When to use**: When auditing or cleaning up workflow configurations
**Example**:
```bash
jira-cli list-workflow-schemes
```

#### 🗑️ `delete-workflow-schemes`
**What it does**: Removes unused workflow schemes
**When to use**: Cleaning up after project deletions or reorganizations
**Options**:
    **-i, --ids <ids>**: Workflow scheme IDs separated by comma (e.g., ID1,ID2,ID3)
    **--unused**: Delete all workflow schemes not linked to any projects
    **--exec**: Execute deletion (without this option, only preview what would be deleted)
**Example**:
```bash
# Preview what would be deleted
jira-cli delete-workflow-schemes --unused

# Actually delete them
jira-cli delete-workflow-schemes --unused --exec
```

#### 🔄 `list-workflows`
**What it does**: Lists workflows (active or inactive)
**When to use**: When reviewing workflow usage
**Options**:
    **--active**: List only active workflows
    **--inactive**: List only inactive workflows
**Example**:
```bash
jira-cli list-workflows --active
jira-cli list-workflows --inactive
```

#### 🗑️ `delete-workflows`
**What it does**: Removes inactive workflows not linked to any schemes
**When to use**: Cleaning up orphaned workflows
**Options**:
    **-i, --ids <ids>**: Workflow IDs separated by comma (e.g., ID1,ID2,ID3)
    **--unused**: Delete all inactive workflows not linked to any schemes
    **--exec**: Execute deletion (without this option, only preview what would be deleted)
**Example**:
```bash
# Preview deletions
jira-cli delete-workflows --unused

# Execute deletions
jira-cli delete-workflows --unused --exec
```

### 🎫 Issue Type Management
Commands for issue types, schemes, and screens

#### 📋 `list-issue-type-screen-schemes`
**What it does**: Shows issue type screen schemes
**When to use**: When configuring issue type displays
**Example**:
```bash
jira-cli list-issue-type-screen-schemes
```

#### 📋 `list-issue-type-schemes`
**What it does**: Shows issue type schemes
**When to use**: When managing issue type configurations
**Example**:
```bash
jira-cli list-issue-type-schemes
```

#### 📋 `list-issue-types`
**What it does**: Lists all issue types
**When to use**: When reviewing available issue types
**Example**:
```bash
jira-cli list-issue-types
```

#### 🖥️ `list-screen-schemes`
**What it does**: Shows screen schemes
**When to use**: When managing screen configurations
**Example**:
```bash
jira-cli list-screen-schemes
```

#### 🖥️ `list-screens`
**What it does**: Lists screens with optional filtering by screen scheme
**When to use**: When reviewing screen configurations or finding screens associated with a specific screen scheme
**Options**:
    **-s, --screen-scheme-id <id>**: Filter screens by screen scheme ID (optional)
**Example**:
```bash
# List all screens
jira-cli list-screens

# List only screens associated with a specific screen scheme
jira-cli list-screens --screen-scheme-id 10001
```

#### 🗑️ `delete-issue-type-screen-schemes`
**What it does**: Removes unused issue type screen schemes
**When to use**: Cleaning up orphaned screen schemes
**Options**:
    **-i, --ids <ids>**: Issue type screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)
    **--unused**: Delete all issue type screen schemes not linked to any projects
    **--exec**: Execute deletion (without this option, only preview what would be deleted)
**Example**:
```bash
# Preview what would be deleted
jira-cli delete-issue-type-screen-schemes --unused

# Actually delete them
jira-cli delete-issue-type-screen-schemes --unused --exec
```

#### 🗑️ `delete-issue-type-schemes`
**What it does**: Removes unused issue type schemes
**When to use**: Cleaning up orphaned issue type schemes
**Options**:
    **-i, --ids <ids>**: Issue type scheme IDs separated by comma (e.g., ID1,ID2,ID3)
    **--unused**: Delete all issue type schemes not linked to any projects AND any issue types
    **--exec**: Execute deletion (without this option, only preview what would be deleted)
**Example**:
```bash
# Preview what would be deleted
jira-cli delete-issue-type-schemes --unused

# Actually delete them
jira-cli delete-issue-type-schemes --unused --exec
```

#### 🗑️ `delete-issue-types`
**What it does**: Deletes specific issue types
**When to use**: Removing custom issue types that are no longer needed
**Options**:
    **-i, --ids <ids>**: Issue type IDs separated by comma (e.g., ID1,ID2,ID3) (required)
**Example**:
```bash
jira-cli delete-issue-types -i 501,502,503
```

#### 🗑️ `delete-screen-schemes`
**What it does**: Removes unused screen schemes
**When to use**: Cleaning up orphaned screen schemes
**Options**:
    **-i, --ids <ids>**: Screen scheme IDs separated by comma (e.g., ID1,ID2,ID3)
    **--unused**: Delete all screen schemes not linked to any issue type screen schemes
    **--exec**: Execute deletion (without this option, only preview what would be deleted)
**Example**:
```bash
# Preview what would be deleted
jira-cli delete-screen-schemes --unused

# Actually delete them
jira-cli delete-screen-schemes --unused --exec
```

#### 🗑️ `delete-screens`
**What it does**: Deletes specific screens
**When to use**: Removing screens that are no longer needed
**Options**:
    **-i, --ids <ids>**: Screen IDs separated by comma (e.g., ID1,ID2,ID3) (required)
**Example**:
```bash
jira-cli delete-screens -i 701,702,703
```

### 🔧 Configuration
Commands for setting up and managing your Jira CLI configuration

#### ⚙️ `set-config`
**What it does**: Sets your Jira credentials and configuration
**When to use**: First-time setup or when changing Jira instances
**Options**:
    **-u, --url <url>**: Jira instance URL (e.g., https://yourcompany.atlassian.net) (required)
    **-e, --email <email>**: Jira user email (required)
    **-t, --token <token>**: Jira API token (required)
    **-l, --log-email <email>**: Email to receive operation logs (optional)
    **--smtp-user <user>**: SMTP email for sending (e.g., your-email@gmail.com) (optional)
    **--smtp-pass <pass>**: App password for SMTP email (optional)
**Example**:
```bash
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token
```

**Advanced options**:
```bash
# With email logging configured from the start
jira-cli set-config -u https://yourcompany.atlassian.net -e your-email@example.com -t your-api-token -l logs@example.com --smtp-user smtp-user@example.com --smtp-pass your-smtp-password
```

### 📧 Email & Logging
Commands for email configuration and operation logs

#### 📧 `set-email-logs`
**What it does**: Configures email for operation logs
**When to use**: When you want email notifications for important operations
**Options**:
    **-l, --log-email <email>**: Email to receive operation logs (required)
    **--smtp-user <user>**: SMTP email for sending (e.g., your-email@gmail.com) (required)
    **--smtp-pass <pass>**: App password for SMTP email (required)
**Example**:
```bash
jira-cli set-email-logs -l logs@example.com --smtp-user smtp-user@example.com --smtp-pass your-smtp-password
```

### 🔄 Recipe 10: "Undoing field operations with operation ID"
    **Situation**: You just executed a field copy/update operation and need to revert it using the operation ID
    **Solution**:
    ```bash
    # 1. Use operation ID from batch operations (most precise method)
    jira-cli undo-field-operation -o "op_1234567890" -t description --exec

    # 2. Use JQL from your original operation to find affected issues
    jira-cli undo-field-operation -j "project in (Relatórios) AND updated >= -10m" -t description --exec

    # 3. Use specific issue keys if you know them
    jira-cli undo-field-operation -i PROJ-123,PROJ-124,PROJ-125 -t customfield_10001 --exec

    # 4. For recent operations, use time-based JQL
    jira-cli undo-field-operation -j "project = PROJ AND updated >= -1h" -t customfield_10001 --exec
    ```

#### 📋 `list-fields`
**What it does**: Lists Jira fields with pagination, filtering, and advanced search capabilities
**When to use**: When you need to find specific fields, audit field usage, or export field configurations
**Options**:
    **--start-at <startAt>**: Page offset (default: 0) (optional)
    **--max-results <maxResults>**: Items per page (default: 50) (optional)
    **--type <type>**: Field types to search (custom, system) - comma separated (optional)
    **--id <id>**: IDs of custom fields to return or filter - comma separated (optional)
    **--query <query>**: Case-insensitive partial match with field names or descriptions (optional)
    **--order-by <orderBy>**: Order results by: contextsCount, lastUsed, name, screensCount (with +/- prefixes) (optional)
    **--expand <expand>**: Expand parameter (optional)
    **--project-ids <projectIds>**: Project IDs to filter - comma separated (optional)
**Example**:
```bash
# List all fields with default pagination
jira-cli list-fields

# Search for fields containing "priority" in name or description
jira-cli list-fields --query priority

# Filter by field type and order by name
jira-cli list-fields --type custom --order-by +name

# Paginate results (start at item 50, show 25 per page)
jira-cli list-fields --start-at 50 --max-results 25

# Filter by specific field IDs
jira-cli list-fields --id customfield_10010,customfield_10020
```

#### 🧹 `cleanup`
    **What it does**: Comprehensive cleanup of unused resources
    **When to use**: Periodic maintenance or before major reorganizations
    **Options**:
        **--complete**: Complete sequential cleanup: archived projects, workflow schemes, workflows, issue type screen schemes, issue type schemes, screen schemes, screens
        **--workflows**: Clean inactive workflows without schemes
        **--workflow-schemes**: Clean inactive workflow schemes
        **--wf-schemes**: Alias for --workflow-schemes
        **--exec**: Execute cleanup (without this option only lists items)
    **Example**:
    ```bash
    # Preview complete cleanup
    jira-cli cleanup --complete

    # Execute cleanup of workflows
    jira-cli cleanup --workflows --exec

    # Execute complete cleanup
    jira-cli cleanup --complete --exec
    ```

### 🎫 Issue Operations
Commands for managing Jira issues

#### 🔍 `get-issue`
    **What it does**: Retrieves detailed information about a specific issue
    **When to use**: When you need to view or export issue details
    **Options**:
        **-i, --issue <issueIdOrKey>**: Issue ID or key (e.g., PROJ-123 or 10001) (required)
        **--fields <fields>**: Comma-separated list of fields to include (optional)
        **--expand <expand>**: Comma-separated list of expansions (optional)
        **--properties <properties>**: Comma-separated list of properties to include (optional)
    **Example**:
    ```bash
    # Get basic issue details
    jira-cli get-issue -i PROJ-123

    # Get specific fields only
    jira-cli get-issue -i PROJ-123 --fields summary,description,status

    # Get with expanded information
    jira-cli get-issue -i PROJ-123 --expand renderedFields,names,schema
    ```

#### 🔎 `search-issues`
    **What it does**: Searches for issues using JQL (Jira Query Language)
    **When to use**: When you need to find issues matching specific criteria
    **Options**:
        **-j, --jql <jql>**: JQL query string (required)
        **--fields <fields>**: Comma-separated list of fields to include (optional)
        **--expand <expand>**: Comma-separated list of expansions (optional)
        **--start-at <startAt>**: Starting index for pagination (default: 0) (optional)
        **--max-results <maxResults>**: Maximum number of results to return (default: 50) (optional)
        **--validate-query**: Whether to validate the JQL query (optional)
    **Example**:
    ```bash
    # Search for issues in a project
    jira-cli search-issues -j "project = PROJ"

    # Search with pagination
    jira-cli search-issues -j "status = 'In Progress'" --start-at 0 --max-results 100

    # Search with specific fields
    jira-cli search-issues -j "assignee = currentUser()" --fields summary,status,priority
    ```

#### 📋 `get-issues-batch`
    **What it does**: Retrieves multiple issues in a single batch operation
    **When to use**: When you need to get details for multiple specific issues
    **Options**:
        **-i, --issues <issues>**: Issue IDs or keys separated by comma (e.g., PROJ-123,PROJ-124,10001) (required)
        **--fields <fields>**: Comma-separated list of fields to include (optional)
        **--expand <expand>**: Comma-separated list of expansions (optional)
    **Example**:
    ```bash
    # Get multiple issues
    jira-cli get-issues-batch -i PROJ-123,PROJ-124,PROJ-125

    # Get multiple issues with specific fields
    jira-cli get-issues-batch -i PROJ-123,PROJ-124 --fields summary,status,assignee
    ```

#### ✏️ `set-issue-field-value`
    **What it does**: Updates a field value on a specific issue
    **When to use**: When you need to modify issue fields programmatically
    **Options**:
        **-i, --issue <issueIdOrKey>**: Issue ID or key (required)
        **-f, --field <fieldId>**: Field ID (e.g., summary, description, customfield_10001) (required)
        **-v, --value <value>**: New value for the field (required)
        **--exec**: Execute the update (without this option, only preview what would be updated) (optional)
    **Example**:
    ```bash
    # Preview update without executing
    jira-cli set-issue-field-value -i PROJ-123 -f summary -v "New summary text"

    # Execute the update
    jira-cli set-issue-field-value -i PROJ-123 -f summary -v "New summary text" --exec

    # Update with append mode
    jira-cli set-issue-field-value -i PROJ-123 -f description -v "Additional text" --append --exec
    ```

#### 📦 `set-issue-field-value-batch`
    **What it does**: Updates a field value on multiple issues
    **When to use**: When you need to apply the same change to multiple issues
    **Options**:
        **-i, --issues <issues>**: Issue IDs or keys separated by comma (required)
        **-f, --field <fieldId>**: Field ID to update (required)
        **-v, --value <value>**: New value for the field (required)
        **--exec**: Execute the update (without this option, only preview what would be updated) (optional)
    **Example**:
    ```bash
    # Preview batch update
    jira-cli set-issue-field-value-batch -i PROJ-123,PROJ-124,PROJ-125 -f summary -v "Updated summary"

    # Execute batch update
    jira-cli set-issue-field-value-batch -i PROJ-123,PROJ-124 -f description -v "New description" --exec
    ```

#### 🔄 `copy-issue-fields-values`
    **What it does**: Copies field values from multiple fields to another within the same issue
    **When to use**: When you need to duplicate or migrate field data or combine multiple fields
    **Options**:
        **-i, --issue <issueIdOrKey>**: Issue ID or key (required)
        **-s, --source-fields <sourceFields>**: Source field IDs separated by comma (required)
        **-t, --target-field <targetFieldId>**: Target field ID (required)
        **--append**: Append to existing value instead of replacing (optional)
        **--separator <separator>**: Separator to use when appending (default: "\n\n") (optional)
        **--field-separator <fieldSeparator>**: Separator between multiple source fields (default: "\n\n") (optional)
        **--exec**: Execute the copy (without this option, only preview what would be copied) (optional)
    **Example**:
    ```bash
    # Preview copy operation
    jira-cli copy-issue-fields-values -i PROJ-123 -s summary,description -t customfield_10001

    # Execute copy with custom separators
    jira-cli copy-issue-fields-values -i PROJ-123 -s summary,priority -t description --append --field-separator " --- " --separator "\n---\n" --exec

    # Execute copy operation
    jira-cli copy-issue-fields-values -i PROJ-123 -s customfield_10001,customfield_10002 -t customfield_10003 --exec
    ```

#### 📦 `copy-issue-fields-values-batch`
    **What it does**: Copies field values for multiple issues with support for multiple source fields, JQL search, and performance optimizations
    **When to use**: When you need to migrate field data across multiple issues or combine multiple fields, especially for large datasets
    **Options**:
        **-i, --issues <issues>**: Issue IDs or keys separated by comma (optional if using JQL)
        **-j, --jql <jql>**: JQL query to find issues (optional if using issue IDs)
        **-s, --source-fields <sourceFields>**: Source field IDs separated by comma (required)
        **-t, --target-field <targetFieldId>**: Target field ID (required)
        **--append**: Append to existing value instead of replacing (optional)
        **--separator <separator>**: Separator to use when appending (default: "\n\n") (optional)
        **--field-separator <fieldSeparator>**: Separator between multiple source fields (default: "\n\n") (optional)
        **--batch-size <batchSize>**: Number of issues to process in parallel (default: 10) (optional)
        **--chunk-size <chunkSize>**: Number of issues to process per chunk (default: 100) (optional)
        **--exec**: Execute the copy (without this option, only preview what would be copied) (optional)
    **Performance Features**:
        - **Parallel Processing**: Processes multiple issues simultaneously for faster execution
        - **Chunking**: Breaks large datasets into manageable chunks to avoid memory issues and timeouts
        - **Rate Limiting**: Includes delays between batches to avoid overwhelming Jira API
        - **Progress Tracking**: Shows real-time progress with ETA and processing rate
        - **Error Resilience**: Continues processing even if individual issues fail
    **Example**:
    ```bash
    # Copy multiple fields across multiple issues with default performance settings
    jira-cli copy-issue-fields-values-batch -i PROJ-123,PROJ-124,PROJ-125 -s summary,description -t customfield_10002

    # Preview copy operation with JQL search
    jira-cli copy-issue-fields-values-batch -j "project = PROJ AND status = 'Done'" -s customfield_10001,customfield_10003 -t description --field-separator " --- " --append

    # Execute high-performance batch copy for large datasets
    jira-cli copy-issue-fields-values-batch -j "project in (PROJ1, PROJ2) AND created >= -30d" -s summary,priority -t customfield_10005 --batch-size 20 --chunk-size 500 --exec

    # Execute copy operation
    jira-cli copy-issue-fields-values-batch -j "assignee = currentUser()" -s summary,priority -t customfield_10005 --exec
    ```

---

## 🎯 Common Use Cases & Recipes

### 🧹 Recipe 1: "I want to clean up unused workflows"
**Situation**: You've deleted some projects and now have orphaned workflows  
**Solution**:
```bash
# 1. First, see what would be deleted
jira-cli delete-workflows --unused

# 2. If everything looks good, execute the deletion
jira-cli delete-workflows --unused --exec

# 3. (Optional) Get email confirmation
jira-cli cleanup --workflows --exec
```

### 📦 Recipe 2: "I need to archive multiple projects"
**Situation**: End of quarter, need to archive completed projects  
**Solution**:
```bash
# 1. List projects to identify candidates
jira-cli list-projects

# 2. Archive them (replace with your project keys)
jira-cli archive-projects -k Q1-PROJ,Q2-PROJ,OLD-PROJ

# 3. Verify they're archived
jira-cli list-projects
```

### 🗂️ Recipe 3: "How to update project categories"
**Situation**: Reorganizing projects into new categories  
**Solution**:
```bash
# 1. List project categories to find the right ID
jira-cli list-project-categories

# 2. Update a single project
jira-cli update-project-category -k PROJ1 -c 10010

# 3. Or update multiple projects at once
jira-cli update-projects-category -k PROJ1,PROJ2,PROJ3 -c 10010
```

### 📧 Recipe 4: "Setting up email notifications"
    **Situation**: Want email confirmations for cleanup operations
    **Solution**:
    ```bash
    # 1. Configure email logging
    jira-cli set-email-logs -l your-email@example.com --smtp-user smtp-user@example.com --smtp-pass your-app-password

    # 2. Test with a small cleanup
    jira-cli cleanup --workflows --exec

    # 3. Check your inbox for the operation summary!
    ```

### 🎫 Recipe 5: "Bulk update issue fields"
    **Situation**: Need to update the same field on multiple issues
    **Solution**:
    ```bash
    # 1. First, find the issues you want to update
    jira-cli search-issues -j "project = PROJ AND status = 'To Do'"

    # 2. Preview the update without executing
    jira-cli set-issue-field-value-batch -i PROJ-123,PROJ-124,PROJ-125 -f customfield_10001 -v "New Value" --dry-run

    # 3. Execute the update with confirmation
    jira-cli set-issue-field-value-batch -i PROJ-123,PROJ-124,PROJ-125 -f customfield_10001 -v "New Value" --confirm

    # 4. Verify the changes
    jira-cli get-issues-batch -i PROJ-123,PROJ-124,PROJ-125 --fields customfield_10001
    ```

### 🔄 Recipe 6: "Migrating field data between fields"
    **Situation**: Need to copy data from multiple custom fields to another or use JQL to find specific issues
    **Solution**:
    ```bash
    # 1. Preview copying multiple fields using JQL search
    jira-cli copy-issue-fields-values-batch -j "project = PROJ AND status = 'Done'" -s customfield_10001,summary,description -t customfield_10002 --dry-run

    # 2. Execute with append mode and custom field separator
    jira-cli copy-issue-fields-values-batch -j "project = PROJ AND status = 'Done'" -s customfield_10001,summary -t customfield_10002 --append --field-separator " --- " --confirm

    # 3. Verify the migration using JQL
    jira-cli search-issues -j "project = PROJ AND customfield_10002 is not EMPTY" --fields customfield_10001,customfield_10002
    ```

### 🚀 Recipe 7: "High-performance batch operations for thousands of issues"
    **Situation**: Need to process thousands of issues efficiently without timeouts or rate limits
    **Solution**:
    ```bash
    # 1. First, estimate the scope with a dry-run
    jira-cli copy-issue-fields-values-batch -j "project in (PROJ1, PROJ2, PROJ3) AND created >= -90d" -s summary,description,customfield_10001 -t customfield_10010 --dry-run

    # 2. For large datasets (1000+ issues), use optimized performance settings
    jira-cli copy-issue-fields-values-batch -j "project in (PROJ1, PROJ2, PROJ3) AND created >= -90d" -s summary,description,customfield_10001 -t customfield_10010 --batch-size 20 --chunk-size 500 --confirm

    # 3. For very large datasets (5000+ issues), use conservative settings to avoid API limits
    jira-cli copy-issue-fields-values-batch -j "project in (PROJ1, PROJ2, PROJ3)" -s summary,description -t customfield_10010 --batch-size 5 --chunk-size 200 --append --confirm

    # 4. Monitor progress and performance with real-time feedback
    # The command will show: "Processing 1250/5000 issues (25.0%) - ETA: 180s"
    ```

### 🔧 Recipe 8: "Troubleshooting large batch operations"
    **Situation**: Batch operations failing or running slowly
    **Solution**:
    ```bash
    # 1. If getting timeouts, reduce batch and chunk sizes
    jira-cli copy-issue-fields-values-batch -j "your-jql-here" -s source-fields -t target-field --batch-size 5 --chunk-size 50

    # 2. If getting rate limit errors, use smaller batch sizes
    jira-cli copy-issue-fields-values-batch -j "your-jql-here" -s source-fields -t target-field --batch-size 3 --chunk-size 100

    # 3. For maximum reliability with large datasets
    jira-cli copy-issue-fields-values-batch -j "your-jql-here" -s source-fields -t target-field --batch-size 1 --chunk-size 50

    # 4. Test with a small subset first
    jira-cli copy-issue-fields-values-batch -j "your-jql-here AND key in (TEST-1, TEST-2, TEST-3)" -s source-fields -t target-field --dry-run
    ```

---

## ⏱️ Timeout & Performance Guide

### ⏰ Why 120-Second Timeout?
All operations in Jira CLI are protected by a **120-second (2-minute) timeout**. This prevents commands from hanging indefinitely due to:
- Slow network connections
- Large Jira instances with many items
- API rate limiting or delays

### 🚨 What Happens When Timeout Occurs?
You'll see a friendly error message like:
```
Error: Operation "listProjects" timed out after 120 seconds
```

### 🔧 Customization Options
Advanced users can adjust the timeout by modifying:
- `src/services/jiraApi.js` - HTTP request timeout
- `src/commands/commands.js` - Command-level timeout

**💡 Pro Tip**: If you frequently hit timeouts, consider breaking large operations into smaller batches!

---

## 🛡️ Rate Limit Handling

### 🚦 Automatic Rate Limit Management
Jira CLI automatically handles **429 Too Many Requests** errors with intelligent retry logic:

- **Exponential Backoff**: Delays increase progressively (5s → 10s → 20s → 30s max)
- **Jitter**: Random variation prevents thundering herd problems
- **Retry-After Respect**: Uses Jira's suggested retry delays when provided
- **Smart Logging**: Tracks all rate limit encounters for transparency

### 📊 Rate Limit Information Display
After batch operations, you'll see rate limit statistics if any were encountered:

```
============================================================
⚠️  RATE LIMIT INFORMATION
============================================================
Total rate limit hits: 3

Rate limit reasons:
  • jira-quota-global-based: 2 times
  • jira-burst-based: 1 times

Affected operations:
  • updateIssueField-PROJ-123-summary: 2 times
  • copyFieldValues-PROJ-124: 1 times

Time range: 2024-01-15T10:30:00Z to 2024-01-15T10:32:15Z

All rate limits were handled automatically with retry logic.
Your operations completed successfully despite the rate limiting.
============================================================
```

### 🎯 Rate Limit Types Handled
- **Global Pool Limits** (`jira-quota-global-based`): Shared 65,000 points/hour across all tenants
- **Per-Tenant Limits** (`jira-quota-tenant-based`): Individual tenant quotas
- **Burst Limits** (`jira-burst-based`): Short-term request spikes
- **Per-Issue Limits** (`jira-per-issue-on-write`): Write operation limits per issue
- **Cost-Based Limits** (`jira-cost-based`): Complex operation throttling

### 🔄 Retry Strategy
- **Max Retries**: 4 attempts (5 total tries)
- **Base Delay**: 5 seconds
- **Max Delay**: 30 seconds
- **Jitter Range**: 70%-130% of calculated delay
- **Retry-After Priority**: Uses Jira's suggested delays when available

### 💡 Best Practices for Rate Limits
- **Use Conservative Batch Sizes**: Start with smaller batches for large operations
- **Monitor Rate Limit Info**: Check the summary after operations
- **Schedule Heavy Operations**: Run large jobs during off-peak hours
- **Leverage Performance Settings**: Use `--batch-size` and `--chunk-size` options

**Example with conservative settings**:
```bash
# For very large datasets, use smaller batches
jira-cli copy-issue-fields-values-batch -j "project in (PROJ1, PROJ2)" \
  -s summary,description -t customfield_10010 \
  --batch-size 5 --chunk-size 200 --exec
```

---

## 📧 Email Logging Explained

### 📨 Which Commands Send Emails?
| Command | Sends Email? | When |
|---------|--------------|------|
| `cleanup` | ✅ | Only with `--exec` flag |
| `cleanup --complete` | ✅ | Only with `--exec` flag |
| All other commands | ❌ | Never |

### 📋 Email Content
Each email includes:
- 📅 Timestamp of operation
- 🛠️ Command executed
- ✅ Success/failure status for each item
- ❌ Error messages (if any)
- 📊 Summary statistics

### 🎨 Email Format
- **Format**: Plain text with HTML `<pre>` tags for formatting
- **Outlook Users**: May need to view in plain text mode for optimal display
- **Mobile Friendly**: Responsive design for all devices

### 🔧 Setup Checklist
1. ✅ Configure SMTP credentials with `set-email-logs`
2. ✅ Test with a small operation using `--exec`
3. ✅ Check spam folder if emails don't arrive
4. ✅ Verify email formatting looks correct

---

## 🔄 Configuration Overrides

### 🎭 Temporary Credentials
Need to run a command with different credentials? Use command-line overrides!

**Example**: Test with a different Jira instance
```bash
jira-cli list-projects -u https://test.atlassian.net -e test@example.com -t test-token
```

### 🎯 Use Cases for Overrides
- **Testing**: Try commands on a test instance first
- **Multi-tenant**: Manage multiple Jira instances
- **Emergency Access**: Use backup credentials when primary fails
- **Auditing**: Run commands as different users

### 📝 Override Pattern
All Jira-interacting commands support these flags:
- `-u, --url <url>`: Jira instance URL
- `-e, --email <email>`: Jira user email  
- `-t, --token <token>`: Jira API token

---

## 🐛 Troubleshooting & Help

### 🔍 Common Issues & Solutions

#### Issue: "Command not found"
**Windows**:
```bash
# Check if EXE is in PATH
where jira-cli

# If not found, add directory to PATH or move EXE
```
**Linux/macOS**:
```bash
# Check if linked correctly
which jira-cli

# If not found, run npm link again
cd /path/to/jira-cli
npm link
```

#### Issue: "Invalid credentials" or "Authentication failed"
**Solutions**:
1. Verify your API token is still valid
2. Check that your email has access to the Jira instance
3. Ensure the Jira URL is correct
4. Try the command with verbose logging

#### Issue: "Rate limit exceeded after 4 retries"
**Solutions**:
1. **Reduce batch sizes**: Use smaller `--batch-size` and `--chunk-size` values
2. **Add delays between operations**: Space out your API calls
3. **Check Jira instance load**: High server load can trigger more rate limits
4. **Review operation timing**: Avoid peak usage hours
5. **Contact Jira admin**: May need quota increase for heavy usage patterns

**Example with conservative settings**:
```bash
# Reduce batch processing intensity
jira-cli copy-issue-fields-values-batch -j "your-jql" \
  -s source-fields -t target-field \
  --batch-size 3 --chunk-size 50 --exec
```

### 🆘 Getting Help
1. **Check command help**: `jira-cli --help` or `jira-cli <command> --help`
2. **Review logs**: Check console output for error details
3. **Enable debug mode**: Add `--verbose` flag to commands
4. **Check configuration**: Verify `~/.jira-cli/config.json` exists and is valid

### 📁 Log Files
- **Location**: Console output only (no persistent log files are created)
- **Debug Mode**: Add `--verbose` to any command for detailed output
- **Error Details**: Full error stack traces are shown in console

---

## 🤝 Contributing & Community

### 🎉 We Welcome Contributions!
Jira CLI is an open-source project built by and for the Jira community. We'd love your help!

#### How to Contribute:
1. **🐛 Report Bugs**: Use the [Issue Tracker](#) with detailed reproduction steps
2. **💡 Suggest Features**: Share your ideas for new commands or improvements
3. **🔧 Submit Code**: Fork the repo, make changes, and open a Pull Request
4. **📖 Improve Documentation**: Help make this README even better!

#### Code of Conduct
We're committed to providing a friendly, safe, and welcoming environment for everyone. Please be respectful and constructive in all interactions.

#### Development Setup
For those interested in contributing code:
```bash
# 1. Fork and clone the repository
git clone https://github.com/yourusername/jira-cli.git
cd jira-cli

# 2. Install dependencies
npm install

# 3. Make your changes
# 4. Test your changes
npm test  # If tests exist

# 5. Submit a Pull Request
```

#### Issue Templates
When reporting issues, please include:
- **Jira CLI Version**: `jira-cli --version`
- **Node.js Version**: `node --version`
- **Operating System**: Windows/Linux/macOS version
- **Steps to Reproduce**: Clear, step-by-step instructions
- **Expected vs Actual Behavior**: What you expected vs what happened

---

## 📄 License & Acknowledgments

### 📜 License
Jira CLI is released under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Summary**: You're free to use, modify, and distribute this software, as long as you include the original copyright notice.

### 🙏 Acknowledgments
This project stands on the shoulders of giants:

- **Node.js** - The JavaScript runtime that makes it all possible
- **Jira REST API v3** - Atlassian's powerful API
- **Commander.js** - Elegant command-line interfaces
- **Axios** - Promise-based HTTP client
- **cli-table3** - Beautiful terminal tables
- **Nodemailer** - Email sending made simple
- **pkg** - Node.js application packager

### 👨‍💻 Maintainer
**Your Name Here** - [GitHub Profile](#) - [Email](#)

### 🌟 Special Thanks
To all the contributors, testers, and users who have helped shape Jira CLI into what it is today!

---

## 🎊 You Made It to the End!

Congratulations on reading through the entire README! 🎉

### Quick Recap:
1. ✅ **Installed** Jira CLI via Windows EXE or Terminal
2. ✅ **Configured** your Jira credentials
3. ✅ **Learned** all the commands and their friendly uses
4. ✅ **Explored** practical recipes for common tasks
5. ✅ **Understood** advanced features like timeouts and email logging

### What's Next?
- **Start using** the commands that match your needs
- **Bookmark** this page for future reference
- **Share** with colleagues who might find it useful
- **Contribute** if you have ideas for improvements

### 📞 Need More Help?
- **Check the command help**: `jira-cli --help`
- **Review the examples** in each command section
- **Try the recipes** for step-by-step guidance

**Happy Jira managing!** 🚀

> *"Automation applied to an efficient operation will magnify the efficiency."* - Bill Gates

### 🛡️ Recipe 9: "Understanding and managing rate limits"
    **Situation**: Getting rate limit warnings or want to optimize for high-volume operations
    **Solution**:
    ```bash
    # 1. Start with a small test to understand your rate limit patterns
    jira-cli copy-issue-fields-values-batch -j "project = TEST AND created >= -1d" -s summary -t description --exec

    # 2. Check the rate limit information displayed after the operation
    # Look for patterns in the "Rate limit reasons" section

    # 3. For Global Pool limits (jira-quota-global-based), use conservative settings
    jira-cli copy-issue-fields-values-batch -j "your-large-query" \
      -s source-fields -t target-field \
      --batch-size 5 --chunk-size 100 --exec

    # 4. For Burst limits (jira-burst-based), add more spacing between requests
    jira-cli copy-issue-fields-values-batch -j "your-query" \
      -s source-fields -t target-field \
      --batch-size 3 --chunk-size 50 --exec

    # 5. For Per-Issue limits (jira-per-issue-on-write), process fewer issues in parallel
    jira-cli copy-issue-fields-values-batch -j "your-query" \
      -s source-fields -t target-field \
      --batch-size 1 --chunk-size 25 --exec

    # 6. Monitor the rate limit summary after each operation to optimize settings
    ```

#### 🔄 `undo-field-operation`
**What it does**: Reverts field changes by analyzing issue changelog with multiple search methods
**When to use**: When you need to undo a field copy or update operation
**Options**:
    **-j, --jql <jql>**: JQL query to find the issues that were modified (optional)
    **-i, --issues <issues>**: Issue keys/IDs separated by comma (optional)
    **-o, --operation-id <operationId>**: Batch operation ID to undo entire batch (optional)
    **--issue-operation-id <issueOperationId>**: Individual issue operation ID to undo specific issue (optional)
    **-t, --target-field <fieldId>**: Field ID that was modified and needs to be reverted (required)
    **--exec**: Execute the undo operation (without this option, only preview what would be undone) (optional)
**Example**:
```bash
# Preview what would be undone using JQL
jira-cli undo-field-operation -j "project = PROJ AND updated >= -1h" -t description

# Execute undo using batch operation ID
jira-cli undo-field-operation -o "op_1767876606828646" -t description --exec

# Undo specific issue using issue operation ID
jira-cli undo-field-operation --issue-operation-id "op_1767876606828647" -t customfield_10001 --exec

# Undo using direct issue keys
jira-cli undo-field-operation -i "PROJ-123,PROJ-124" -t description --exec
```