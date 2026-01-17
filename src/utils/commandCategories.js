/**
 * Command categorization mapping for Jira CLI
 * Maps command names to logical categories for help output organization
 */

const COMMAND_CATEGORIES = {
  // Configuration Commands (2)
  'set-config': 'Configuration',
  'set-email-logs': 'Configuration',
  
  // Project Commands (9)
  'list-projects': 'Projects',
  'archive-project': 'Projects',
  'archive-projects': 'Projects',
  'update-project-name': 'Projects',
  'update-project-category': 'Projects',
  'update-projects-category': 'Projects',
  'project-details': 'Projects',
  'delete-projects': 'Projects',
  'list-project-categories': 'Projects',
  'list-projects-by-category': 'Projects',
  
  // Workflow Commands (4)
  'list-workflows': 'Workflows',
  'delete-workflows': 'Workflows',
  'list-workflow-schemes': 'Workflows',
  'delete-workflow-schemes': 'Workflows',
  
  // Screen Commands (4)
  'list-screens': 'Screens',
  'delete-screens': 'Screens',
  'list-screen-schemes': 'Screens',
  'delete-screen-schemes': 'Screens',
  
  // Issue Type Commands (6)
  'list-issue-types': 'Issue Types',
  'delete-issue-types': 'Issue Types',
  'list-issue-type-schemes': 'Issue Types',
  'delete-issue-type-schemes': 'Issue Types',
  'list-issue-type-screen-schemes': 'Issue Types',
  'delete-issue-type-screen-schemes': 'Issue Types',
  
  // Field Commands (4)
  'list-fields': 'Fields',
  'list-field-configuration-schemes': 'Fields',
  'assign-field-configuration-scheme': 'Fields',
  'assign-screen-scheme': 'Fields',
  
  // Issue Commands (8)
  'get-issue': 'Issues',
  'search-issues': 'Issues',
  'get-issues-batch': 'Issues',
  'set-issue-field-value': 'Issues',
  'set-issue-field-value-batch': 'Issues',
  'copy-issue-fields-values': 'Issues',
  'copy-issue-fields-values-batch': 'Issues',
  'undo-field-operation': 'Issues',
  
  // Cleanup Commands (1)
  'cleanup': 'Cleanup',
};

/**
 * Get the category for a command
 * @param {string} commandName - The command name
 * @returns {string} The category name or 'General' if not found
 */
function getCommandCategory(commandName) {
  return COMMAND_CATEGORIES[commandName] || 'General';
}

/**
 * Group commands by category
 * @param {Array} commands - Array of command objects from Commander
 * @returns {Object} Commands grouped by category
 */
function groupCommandsByCategory(commands) {
  const grouped = {};
  
  commands.forEach(command => {
    const category = getCommandCategory(command.name());
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(command);
  });
  
  return grouped;
}

/**
 * Get category display order for consistent sorting
 * @returns {Array} Ordered list of category names
 */
function getCategoryOrder() {
  return [
    'Configuration',
    'Projects',
    'Workflows',
    'Screens',
    'Issue Types',
    'Fields',
    'Issues',
    'Cleanup',
    'General'
  ];
}

module.exports = {
  COMMAND_CATEGORIES,
  getCommandCategory,
  groupCommandsByCategory,
  getCategoryOrder
};