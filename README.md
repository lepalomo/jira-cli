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
2. **Place** the executable in a directory that's in your system PATH
   - Example: `C:\Users\YourName\bin\` or `C:\Windows\System32\`
3. **Open** Command Prompt or PowerShell
4. **Verify** installation by running:
   ```bash
   jira-cli --help
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
**Example**:
```bash
jira-cli archive-project -k PROJ1
```

#### 📦 `archive-projects`
**What it does**: Archives multiple projects at once  
**When to use**: Batch cleanup of inactive projects  
**Example**:
```bash
jira-cli archive-projects -k PROJ1,PROJ2,PROJ3
```

#### ✏️ `update-project-name`
**What it does**: Changes a project's display name  
**When to use**: When projects need rebranding or correction  
**Example**:
```bash
jira-cli update-project-name -k PROJ1 -n "New Project Name"
```

#### 🗂️ `update-project-category`
**What it does**: Updates a project's category
**When to use**: When reorganizing projects into different categories
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
**Example**:
```bash
jira-cli list-projects-by-category -c 10010
```

#### 🗂️ `update-projects-category`
**What it does**: Updates category for multiple projects at once
**When to use**: When moving multiple projects to a new category
**Example**:
```bash
jira-cli update-projects-category -k PROJ1,PROJ2,PROJ3 -c 10010
```

#### 🗑️ `delete-projects`
**What it does**: Permanently deletes multiple projects
**When to use**: **Use with caution!** Only for projects that truly need removal
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
**Example**:
```bash
jira-cli list-workflows --active
jira-cli list-workflows --inactive
```

#### 🗑️ `delete-workflows`
**What it does**: Removes inactive workflows not linked to any schemes  
**When to use**: Cleaning up orphaned workflows  
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
**What it does**: Lists all screens
**When to use**: When reviewing screen configurations
**Example**:
```bash
jira-cli list-screens
```

#### 🗑️ `delete-issue-type-screen-schemes`
**What it does**: Removes unused issue type screen schemes
**When to use**: Cleaning up orphaned screen schemes
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
**Example**:
```bash
jira-cli delete-issue-types -i 501,502,503
```

#### 🗑️ `delete-screen-schemes`
**What it does**: Removes unused screen schemes
**When to use**: Cleaning up orphaned screen schemes
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
**Example**:
```bash
jira-cli delete-screens -i 701,702,703
```

### 🔧 Configuration
Commands for setting up and managing your Jira CLI configuration

#### ⚙️ `set-config`
**What it does**: Sets your Jira credentials and configuration
**When to use**: First-time setup or when changing Jira instances
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
**Example**:
```bash
jira-cli set-email-logs -l logs@example.com --smtp-user smtp-user@example.com --smtp-pass your-smtp-password
```

### 🛠️ Advanced Tools
Powerful tools for complex operations

#### 🧹 `cleanup`
**What it does**: Comprehensive cleanup of unused resources  
**When to use**: Periodic maintenance or before major reorganizations  
**Example**:
```bash
# Preview complete cleanup
jira-cli cleanup --complete

# Execute cleanup of workflows
jira-cli cleanup --workflows --exec

# Execute complete cleanup
jira-cli cleanup --complete --exec
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

#### Issue: "Timeout after 120 seconds"
**Solutions**:
1. Break large operations into smaller batches
2. Check your network connection to Jira
3. Consider if Jira instance is under heavy load
4. Adjust timeout settings in the code

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