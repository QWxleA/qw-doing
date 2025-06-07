#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { addLogEntryCore, listTodayEntriesCore, FileOperations } from '../shared/core';
import { LoggerConfig, AddEntryCommand, LoggerErrorType } from '../shared/types';
import { createLoggerError } from '../shared/utils';

// CLI-specific argument interface
interface CommandArgs {
  message?: string;
  time?: string;
  list?: boolean;
  undo?: boolean;
  help?: boolean;
}

// Default configuration for CLI
const DEFAULT_CONFIG: LoggerConfig = {
  journalDir: process.env.HOME + '/Documents/ThirdTime/Journal',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  todayHeader: '## Today'
};

// File operations implementation for Node.js
const createNodeFileOperations = (): FileOperations => ({
  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  },

  async read(path: string): Promise<string> {
    return fs.readFileSync(path, 'utf-8');
  },

  async write(path: string, content: string): Promise<void> {
    fs.writeFileSync(path, content, 'utf-8');
  },

  async ensureDir(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
});

/**
 * Validates that the journal directory exists and is accessible
 */
const validateJournalDirectory = (journalDir: string): void => {
  if (!fs.existsSync(journalDir)) {
    throw createLoggerError(
      'DIRECTORY_NOT_FOUND',
      `Journal directory does not exist: ${journalDir}\nPlease create the directory or update the JOURNAL_DIR path in the script.`
    );
  }
  
  // Check if directory is writable
  try {
    fs.accessSync(journalDir, fs.constants.W_OK);
  } catch (error) {
    throw createLoggerError(
      'DIRECTORY_NOT_FOUND',
      `Journal directory is not writable: ${journalDir}`
    );
  }
};

/**
 * Lists today's log entries using the shared core function
 */
const listTodayEntries = async (config: LoggerConfig = DEFAULT_CONFIG): Promise<void> => {
  try {
    validateJournalDirectory(config.journalDir);
    
    const fileOps = createNodeFileOperations();
    const result = await listTodayEntriesCore(config, fileOps);
    
    if (!result.success) {
      console.error(`❌ ${result.error.message}`);
      process.exit(1);
      return;
    }
    
    const { entries, filename } = result.data;
    
    if (entries.length === 0) {
      console.log(`📋 No log entries found for today in ${filename}`);
      console.log(`💡 Add your first entry with: 2do "Your message here"`);
      return;
    }
    
    console.log(`📋 Today's log entries (${filename}):`);
    console.log('');
    entries.forEach(entry => {
      console.log(`  ${entry.raw}`);
    });
    console.log('');
    console.log(`📊 Total entries: ${entries.length}`);
    
  } catch (error: any) {
    if (error && error.type) {
      console.error(`❌ ${error.message}`);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
    process.exit(1);
  }
};

/**
 * Adds a log entry using the shared core function
 */
const addLogEntry = async (logMessage: string, customTime?: string, config: LoggerConfig = DEFAULT_CONFIG): Promise<void> => {
  try {
    validateJournalDirectory(config.journalDir);
    
    const command: AddEntryCommand = {
      message: logMessage,
      customTime
    };
    
    const fileOps = createNodeFileOperations();
    const result = await addLogEntryCore(command, config, fileOps);
    
    if (!result.success) {
      console.error(`❌ ${result.error.message}`);
      if (result.error.type === 'HEADER_NOT_FOUND') {
        console.error(`💡 Tip: Make sure your daily note contains a "${config.todayHeader}" header.`);
      }
      process.exit(1);
      return;
    }
    
    const { entryAdded, totalEntries, isNewFile, parsedTime } = result.data;
    
    // Success feedback
    if (isNewFile) {
      console.log(`📄 Created new daily note`);
    }
    console.log(`✅ Added log entry: ${entryAdded}`);
    
    if (parsedTime) {
      console.log(`🤖 Parsed natural language time reference to: ${parsedTime}`);
    } else if (customTime) {
      console.log(`🕐 Used custom timestamp: ${customTime}`);
    }
    
    console.log(`📊 Total entries: ${totalEntries}`);
    
  } catch (error: any) {
    if (error && error.type) {
      console.error(`❌ ${error.message}`);
      if (error.type === 'HEADER_NOT_FOUND') {
        console.error(`💡 Tip: Make sure your daily note contains a "${config.todayHeader}" header.`);
      }
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
    process.exit(1);
  }
};

/**
 * Parses command line arguments
 */
const parseArguments = (args: string[]): CommandArgs => {
  const result: CommandArgs = {};
  const messageArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        result.help = true;
        break;
        
      case '-l':
      case '--list':
        result.list = true;
        break;
        
      case '-u':
      case '--undo':
        result.undo = true;
        break;
        
      case '-t':
      case '--time':
        if (i + 1 < args.length) {
          result.time = args[i + 1];
          i++; // Skip next argument as it's the time value
        } else {
          throw createLoggerError(
            'INVALID_ARGUMENTS',
            'Option -t/--time requires a time value (e.g., -t 14:30)'
          );
        }
        break;
        
      default:
        // If it starts with a dash but isn't recognized, it's an error
        if (arg.startsWith('-')) {
          throw createLoggerError(
            'INVALID_ARGUMENTS',
            `Unknown option: ${arg}`
          );
        }
        // Otherwise, it's part of the message
        messageArgs.push(arg);
        break;
    }
  }
  
  if (messageArgs.length > 0) {
    result.message = messageArgs.join(' ');
  }
  
  return result;
};

/**
 * Displays help information
 */
const displayHelp = (): void => {
  console.log(`
2do - Daily Note Logger for Obsidian

Usage:
  2do [OPTIONS] <message>    Add a timestamped entry to today's note
  2do [OPTIONS]              List today's entries (default when no message)

Options:
  -t, --time HH:mm           Override timestamp (entries sorted chronologically)
  -l, --list                 List today's log entries
  -u, --undo                 Remove the last log entry (legacy - not implemented with shared core)
  -h, --help                 Show this help message

Examples:
  2do "Had a productive morning call"
  2do -t 09:30 "Retrospective meeting notes"
  2do --time 14:15 "Met with Sarah about project timeline"
  2do "had lunch @an hour ago"              # Natural language time parsing
  2do "morning standup @this morning at 9am" # More complex natural language
  2do "meeting prep @yesterday at 2pm"      # Past date references
  2do "code review @14:30"                  # Still supports exact time with @
  2do -l                                    # List today's entries
  2do --list                                # List today's entries  

Natural Language Time Parsing:
  Use @ followed by natural language to specify when something happened:
  • @an hour ago
  • @this morning at 9am
  • @yesterday afternoon
  • @30 minutes ago
  • @today at noon
  • @14:30 (exact time also works with @)

Configuration:
  Journal directory: ${DEFAULT_CONFIG.journalDir}
  Daily note format: YYYY-MM-DD.md
  Entry format: - **HH:mm** <message>
  Target header: ${DEFAULT_CONFIG.todayHeader}

Features:
  • Automatic chronological sorting of entries
  • Smart daily note creation
  • Natural language time parsing with @ syntax
  • Custom timestamp support
  • Integration with Obsidian markdown format
  • Shared codebase with Obsidian plugin

The tool will create a new daily note if one doesn't exist for today.
`);
};

/**
 * Main function that processes command line arguments
 */
const main = async (): Promise<void> => {
  try {
    const args = process.argv.slice(2);
    
    // If no arguments, default to list
    if (args.length === 0) {
      await listTodayEntries();
      return;
    }
    
    const parsed = parseArguments(args);
    
    // Handle help
    if (parsed.help) {
      displayHelp();
      return;
    }
    
    // Handle list
    if (parsed.list) {
      await listTodayEntries();
      return;
    }
    
    // Handle undo (legacy - would need to be implemented with shared core)
    if (parsed.undo) {
      console.log('❌ Undo functionality not yet implemented with shared core');
      console.log('💡 Use the list command to see entries, then manually edit the file');
      return;
    }
    
    // Handle adding entry
    if (parsed.message) {
      await addLogEntry(parsed.message, parsed.time);
    } else if (parsed.time) {
      // If time is specified but no message, that's an error
      throw createLoggerError(
        'INVALID_ARGUMENTS',
        'When using -t/--time, you must also provide a message'
      );
    } else {
      // No message and no other action specified, default to list
      await listTodayEntries();
    }
    
  } catch (error: any) {
    if (error && error.type) {
      console.error(`❌ ${error.message}`);
      if (error.type === 'INVALID_ARGUMENTS') {
        console.error(`💡 Use '2do --help' to see usage instructions.`);
      }
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

// Export for potential future use as a module
export { addLogEntry, listTodayEntries, main };