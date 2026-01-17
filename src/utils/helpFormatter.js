const { Help } = require('commander');
const { groupCommandsByCategory, getCategoryOrder } = require('./commandCategories');

/**
 * Custom help formatter that groups commands by category
 * Extends Commander's Help class to provide categorized command output
 */
class CategorizedHelp extends Help {
  /**
   * Format the help output with commands grouped by category
   * @param {Command} command - The command to format help for
   * @param {HelpContext} context - Help context
   * @returns {string} Formatted help text
   */
  formatHelp(command, context) {
    // Get the default help output
    const defaultHelp = super.formatHelp(command, context);
    
    // Only categorize commands for the main program help (not subcommand help)
    if (command.parent || !command.commands || command.commands.length === 0) {
      return defaultHelp;
    }
    
    // Group commands by category
    const groupedCommands = groupCommandsByCategory(command.commands);
    const categoryOrder = getCategoryOrder();
    
    // Find where the command listing starts
    const commandsHeader = '\n\nCommands:';
    const commandsIndex = defaultHelp.indexOf(commandsHeader);
    
    // If we can't find the commands section, return default help
    if (commandsIndex === -1) {
      return defaultHelp;
    }
    
    // Extract everything up to (but not including) "Commands:" header
    const header = defaultHelp.substring(0, commandsIndex);
    
    // Build categorized command sections
    let categorizedCommands = '';
    
    // Add categorized command sections
    categoryOrder.forEach(category => {
      const commands = groupedCommands[category];
      if (commands && commands.length > 0) {
        categorizedCommands += `\n\n${category} Commands:`;
        
        // Sort commands alphabetically within category
        const sortedCommands = commands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
        
        sortedCommands.forEach(cmd => {
          const cmdName = cmd.name();
          const alias = cmd.alias() ? `|${cmd.alias()}` : '';
          const description = cmd.description() || '';
          
          // Format with consistent spacing (similar to default help)
          const term = cmdName + (alias ? ',' + alias : '');
          const spacing = ' '.repeat(Math.max(38 - term.length, 1));
          categorizedCommands += `\n  ${term}${spacing}${description}`;
        });
      }
    });
    
    // Add any remaining commands that weren't categorized (should be none)
    const uncategorizedCommands = command.commands.filter(cmd => {
      const category = require('./commandCategories').getCommandCategory(cmd.name());
      return category === 'General';
    });
    
    if (uncategorizedCommands.length > 0) {
      categorizedCommands += '\n\nGeneral Commands:';
      uncategorizedCommands.forEach(cmd => {
        const cmdName = cmd.name();
        const alias = cmd.alias() ? `|${cmd.alias()}` : '';
        const description = cmd.description() || '';
        
        const term = cmdName + (alias ? ',' + alias : '');
        const spacing = ' '.repeat(Math.max(38 - term.length, 1));
        categorizedCommands += `\n  ${term}${spacing}${description}`;
      });
    }
    
    // Combine header with categorized commands and ensure trailing newline
    return header + categorizedCommands + '\n';
  }
  
  /**
   * Format command usage string
   * @param {Command} command - The command
   * @returns {string} Usage string
   */
  commandUsage(command) {
    const name = command.name();
    const args = command._args.map(arg => {
      return arg.required ? `<${arg.name}>` : `[${arg.name}]`;
    }).join(' ');
    
    return args ? `${name} ${args}` : name;
  }
}

/**
 * Override a command's helpInformation method to use categorized help
 * @param {Command} command - The command to override
 */
function overrideHelpInformation(command) {
  const originalHelpInformation = command.helpInformation;
  command.helpInformation = function() {
    // Create a help instance using our custom formatter
    const help = new CategorizedHelp();
    // The helper context should be the help instance itself
    return help.formatHelp(this, help);
  };
}

module.exports = {
  CategorizedHelp,
  overrideHelpInformation
};