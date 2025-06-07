import { 
  LoggerConfig, 
  LogEntry, 
  LoggerResult, 
  AddEntryCommand 
} from './types';
import {
  getCurrentTime,
  validateTimeFormat,
  formatTime,
  createLoggerError,
  getTodayFilename,
  createDailyNoteTemplate,
  findTodaySection,
  getTodayLogEntries,
  parseLogEntry,
  compareTimeStrings
} from './utils';
import { parseMessageWithTime } from './timeParser';

// Abstract file operations interface - to be implemented by CLI and plugin
export interface FileOperations {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  ensureDir(path: string): Promise<void>;
}

/**
 * Core function to add a log entry - works with both CLI and plugin
 * Now supports natural language time parsing with @ syntax
 */
export const addLogEntryCore = async (
  command: AddEntryCommand,
  config: LoggerConfig,
  fileOps: FileOperations
): Promise<LoggerResult<{ entryAdded: string; totalEntries: number; isNewFile: boolean; parsedTime?: string }>> => {
  try {
    const filename = getTodayFilename();
    const filepath = `${config.journalDir}/${filename}`;
    
    // Parse the message for natural language time references
    const parsed = parseMessageWithTime(command.message);
    let timestamp: string;
    let finalMessage = parsed.message;
    
    // Determine timestamp priority: customTime > parsed @ time > current time
    if (command.customTime) {
      if (!validateTimeFormat(command.customTime)) {
        return {
          success: false,
          error: createLoggerError(
            'INVALID_TIME_FORMAT',
            `Invalid time format: "${command.customTime}". Please use HH:mm format (e.g., 14:30)`
          )
        };
      }
      timestamp = formatTime(command.customTime);
    } else if (parsed.timestamp) {
      timestamp = parsed.timestamp;
    } else {
      timestamp = getCurrentTime();
    }
    
    const logEntry = `- **${timestamp}** ${finalMessage}`;
    
    let content: string;
    let isNewFile = false;
    
    // Read existing file or create new one
    if (await fileOps.exists(filepath)) {
      content = await fileOps.read(filepath);
    } else {
      content = createDailyNoteTemplate();
      isNewFile = true;
      await fileOps.ensureDir(config.journalDir);
    }
    
    // Get current entries and add new one
    const section = findTodaySection(content, config.todayHeader);
    const existingEntries = getTodayLogEntries(content, config.todayHeader);
    
    // Create new entry object
    const newEntry: LogEntry = {
      time: timestamp,
      message: finalMessage,
      raw: logEntry
    };
    
    // Add new entry and sort all entries
    const allEntries = [...existingEntries, newEntry];
    allEntries.sort((a, b) => compareTimeStrings(a.time, b.time));
    
    // Rebuild the Today section with sorted entries
    const lines = section.lines;
    
    // Remove existing log entries from the Today section
    for (let i = section.endIndex - 1; i > section.startIndex; i--) {
      const entry = parseLogEntry(lines[i]);
      if (entry) {
        lines.splice(i, 1);
      }
    }
    
    // Add all entries back in sorted order
    const insertPosition = section.startIndex + 1;
    allEntries.forEach((entry, index) => {
      lines.splice(insertPosition + index, 0, entry.raw);
    });
    
    // Write back to file
    const updatedContent = lines.join('\n');
    await fileOps.write(filepath, updatedContent);
    
    return {
      success: true,
      data: {
        entryAdded: logEntry,
        totalEntries: allEntries.length,
        isNewFile,
        parsedTime: parsed.isNaturalLanguage ? parsed.timestamp : undefined
      }
    };
    
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      return {
        success: false,
        error: error as any
      };
    }
    
    return {
      success: false,
      error: createLoggerError(
        'FILE_WRITE_ERROR',
        `Unexpected error: ${(error as Error).message}`,
        error as Error
      )
    };
  }
};

/**
 * Core function to list today's entries
 */
export const listTodayEntriesCore = async (
  config: LoggerConfig,
  fileOps: FileOperations
): Promise<LoggerResult<{ entries: LogEntry[]; filename: string }>> => {
  try {
    const filename = getTodayFilename();
    const filepath = `${config.journalDir}/${filename}`;
    
    if (!(await fileOps.exists(filepath))) {
      return {
        success: true,
        data: {
          entries: [],
          filename
        }
      };
    }
    
    const content = await fileOps.read(filepath);
    const entries = getTodayLogEntries(content, config.todayHeader);
    
    return {
      success: true,
      data: {
        entries,
        filename
      }
    };
    
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      return {
        success: false,
        error: error as any
      };
    }
    
    return {
      success: false,
      error: createLoggerError(
        'FILE_WRITE_ERROR',
        `Error reading entries: ${(error as Error).message}`,
        error as Error
      )
    };
  }
};