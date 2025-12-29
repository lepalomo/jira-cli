# Jira CLI

A command-line interface tool to interact with Jira API v3.

## Prerequisites

- **Node.js** (version 14 or higher): Download from [nodejs.org](https://nodejs.org/).
- **npm** (comes with Node.js).
- A Jira account with API access (generate an API token from your Jira account settings).

## Installation

### Quick Install (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lepalomo/jira-cli.git
   cd jira-cli
   ```

2. **Install dependencies and setup**:
   ```bash
   npm install
   npm link
   ```

3. **You're ready!** The `jira-cli` command is now available globally.

### Alternative: Using Install Scripts

- **Linux/Mac/WSL**: `./install.sh`
- **Windows PowerShell**: `.\install.ps1`

## Usage

### Set Configuration

First, set your Jira credentials (do this once):

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
- `list-workflows`: List workflows (--active or --inactive).
- `cleanup`: Clean up unused resources (--workflows).

## Supported Platforms

- **Windows**: PowerShell, Command Prompt, or WSL
- **Linux**: Any terminal with Bash/Zsh
- **macOS**: Terminal with Bash/Zsh

## Requirements

- Node.js (version 14 or higher)
- Jira API token (generate from your Jira account settings)