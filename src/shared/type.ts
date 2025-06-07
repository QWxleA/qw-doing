// Configuration interface for both CLI and plugin
export interface LoggerConfig {
  journalDir: string;
  dateFormat?: string;
  timeFormat?: string;
  todayHeader?: string;
}

// Log entry interface for better type safety
export interface LogEntry {
  time: string;
  message: string;
  raw: string; // The full "- HH:mm message" line
}

// Result types for better error handling
export type LoggerResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: LoggerError;
};

// Error types
export type LoggerErrorType = 
  | 'DIRECTORY_NOT_FOUND'
  | 'HEADER_NOT_FOUND'
  | 'FILE_WRITE_ERROR'
  | 'INVALID_ARGUMENTS'
  | 'INVALID_TIME_FORMAT'
  | 'NO_ENTRIES_TO_UNDO'
  | 'FILE_NOT_FOUND';

export interface LoggerError {
  type: LoggerErrorType;
  message: string;
  originalError?: Error;
}

// Plugin-specific interfaces
export interface PluginConfig extends LoggerConfig {
  vaultPath: string;
}

// Command interfaces for the plugin
export interface AddEntryCommand {
  message: string;
  customTime?: string;
}

export interface TodaySection {
  startIndex: number;
  endIndex: number;
  lines: string[];
}