import { LogEntry, TodaySection, LoggerError, LoggerErrorType } from './types';

/**
 * Creates a LoggerError object
 */
export const createLoggerError = (
  type: LoggerErrorType,
  message: string,
  originalError?: Error
): LoggerError => ({
  type,
  message,
  originalError
});

/**
 * Pads a number with leading zeros
 */
export const padZero = (num: number, length: number = 2): string => {
  return String(num).length >= length 
    ? String(num) 
    : '0'.repeat(length - String(num).length) + num;
};

/**
 * Gets the current date in YYYY-MM-DD format for the daily note filename
 */
export const getTodayFilename = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = padZero(today.getMonth() + 1);
  const day = padZero(today.getDate());
  return `${year}-${month}-${day}.md`;
};

/**
 * Gets the current time in HH:mm format
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = padZero(now.getHours());
  const minutes = padZero(now.getMinutes());
  return `${hours}:${minutes}`;
};

/**
 * Validates time format HH:mm
 */
export const validateTimeFormat = (timeString: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Formats time to HH:mm ensuring proper padding
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  return `${padZero(parseInt(hours))}:${padZero(parseInt(minutes))}`;
};

/**
 * Parses a log entry line to extract time and message
 */
export const parseLogEntry = (line: string): LogEntry | null => {
  const logEntryRegex = /^-\s+(?:\*\*)?(\d{1,2}:\d{2})(?:\*\*)?\s+(.+)$/;
  const match = line.match(logEntryRegex);
  
  if (match) {
    return {
      time: match[1],
      message: match[2],
      raw: line
    };
  }
  
  return null;
};

/**
 * Compares two time strings for sorting (HH:mm format)
 */
export const compareTimeStrings = (timeA: string, timeB: string): number => {
  const [hoursA, minutesA] = timeA.split(':').map(Number);
  const [hoursB, minutesB] = timeB.split(':').map(Number);
  
  const totalMinutesA = hoursA * 60 + minutesA;
  const totalMinutesB = hoursB * 60 + minutesB;
  
  return totalMinutesA - totalMinutesB;
};

/**
 * Creates a basic daily note template
 */
export const createDailyNoteTemplate = (): string => {
  const dateString = getTodayFilename().replace('.md', '');
  return `# ${dateString}

## Today

`;
};

/**
 * Finds the content within the "## Today" section
 */
export const findTodaySection = (content: string, headerText: string = '## Today'): TodaySection => {
  const lines = content.split('\n');
  let todayHeaderIndex = -1;
  
  // Find the specified header
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === headerText) {
      todayHeaderIndex = i;
      break;
    }
  }
  
  if (todayHeaderIndex === -1) {
    throw createLoggerError(
      'HEADER_NOT_FOUND',
      `Could not find "${headerText}" header in the daily note. Make sure the header exists or create it manually.`
    );
  }
  
  // Find the next header (##) or end of file to determine section boundaries
  let endIndex = lines.length;
  for (let i = todayHeaderIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIndex = i;
      break;
    }
  }
  
  return {
    startIndex: todayHeaderIndex,
    endIndex: endIndex,
    lines: lines
  };
};

/**
 * Gets all log entries from the Today section, sorted chronologically
 */
export const getTodayLogEntries = (content: string, headerText: string = '## Today'): LogEntry[] => {
  const section = findTodaySection(content, headerText);
  const entries: LogEntry[] = [];
  
  // Extract log entries from the Today section
  for (let i = section.startIndex + 1; i < section.endIndex; i++) {
    const line = section.lines[i];
    const entry = parseLogEntry(line);
    if (entry) {
      entries.push(entry);
    }
  }
  
  // Sort entries chronologically
  entries.sort((a, b) => compareTimeStrings(a.time, b.time));
  
  return entries;
};