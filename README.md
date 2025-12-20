# Jira CLI

A command-line interface tool to interact with Jira API v3.

## Prerequisites

- **Node.js** (version 14 or higher): Download from [nodejs.org](https://nodejs.org/).
- **npm** (comes with Node.js).
- A Jira account with API access (generate an API token from your Jira account settings).

## Installation

### Option 1: Quick Install (Recommended for Beginners)

1. **Clone or download the project**:
   - If using Git: `git clone https://github.com/YOUR-USERNAME/jira-cli.git`
   - Or download the ZIP from GitHub and extract it.

2. **Navigate to the project folder**:
   - Open a terminal (Command Prompt, PowerShell, or Bash) and go to the project directory, e.g., `cd jira-cli`.

3. **Run the installer**:
   - On Linux/Mac/WSL: `./install.sh`
   - On Windows (PowerShell): `.\install.ps1`
   - This will install dependencies and set up the `jira-cli` command globally.

### Option 2: Manual Install

1. Clone or download the project as above.
2. Navigate to the project folder.
3. Run `npm install` to install dependencies.
4. Run `npm link` to create a global symlink for the `jira-cli` command.

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

## Supported Platforms

- **Windows**: Use PowerShell or Command Prompt. Run `.\install.ps1` for installation.
- **Linux/Mac**: Use Bash or Zsh. Run `./install.sh` for installation.
- **WSL (Windows Subsystem for Linux)**: Same as Linux.

## Requirements

- Node.js (version 14 or higher)
- Jira API token (generate from your Jira account settings)