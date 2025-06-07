import * as chrono from 'chrono-node';
import { formatTime, validateTimeFormat, getTodayFilename } from './utils';

export interface ParsedMessage {
  message: string;
  timestamp?: string;
  targetDate?: string; // YYYY-MM-DD format
  isNaturalLanguage: boolean;
  isFutureDate?: boolean;
}

/**
 * Gets filename for a specific date
 */
const getFilenameForDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}.md`;
};

/**
 * Checks if a date is in the future (after today)
 */
const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return targetDate > today;
};

/**
 * Parses a message that might contain a natural language time reference
 * Format: "message text @time reference"
 * Examples:
 * - "had lunch @an hour ago"
 * - "morning standup @this morning at 9am"
 * - "meeting prep @yesterday afternoon"
 * - "code review @14:30" (still supports exact time)
 * - "drank coffee @yesterday" (writes to yesterday's file)
 */
export const parseMessageWithTime = (input: string): ParsedMessage => {
  // Check if input contains @ symbol
  const atIndex = input.lastIndexOf('@');
  
  if (atIndex === -1) {
    // No time reference, return as-is
    return {
      message: input.trim(),
      isNaturalLanguage: false
    };
  }
  
  const message = input.substring(0, atIndex).trim();
  const timeReference = input.substring(atIndex + 1).trim();
  
  if (!timeReference) {
    // @ symbol but no time reference
    return {
      message: input.trim(),
      isNaturalLanguage: false
    };
  }
  
  // First check if it's a standard HH:mm format
  if (validateTimeFormat(timeReference)) {
    return {
      message,
      timestamp: formatTime(timeReference),
      isNaturalLanguage: false
    };
  }
  
  // Try to parse as natural language
  try {
    const results = chrono.parse(timeReference);
    
    if (results.length > 0) {
      const result = results[0];
      const parsedDate = result.start.date();
      
      // Check if this is a future date
      if (isFutureDate(parsedDate)) {
        return {
          message,
          isNaturalLanguage: true,
          isFutureDate: true
        };
      }
      
      // Extract HH:mm from the parsed date
      const hours = parsedDate.getHours().toString().padStart(2, '0');
      const minutes = parsedDate.getMinutes().toString().padStart(2, '0');
      const timestamp = `${hours}:${minutes}`;
      
      // Get the target filename for the parsed date
      const targetFilename = getFilenameForDate(parsedDate);
      
      return {
        message,
        timestamp,
        targetDate: targetFilename,
        isNaturalLanguage: true
      };
    }
  } catch (error) {
    // Chrono parsing failed, ignore the time reference
    console.warn(`Failed to parse time reference: "${timeReference}"`, error);
  }
  
  // If parsing fails, treat the whole thing as the message
  return {
    message: input.trim(),
    isNaturalLanguage: false
  };
};

/**
 * Alternative parser that's more forgiving with natural language
 * Uses chrono's parse() method to get more detailed results
 */
export const parseMessageWithTimeAdvanced = (input: string): ParsedMessage => {
  const atIndex = input.lastIndexOf('@');
  
  if (atIndex === -1) {
    return {
      message: input.trim(),
      isNaturalLanguage: false
    };
  }
  
  const message = input.substring(0, atIndex).trim();
  const timeReference = input.substring(atIndex + 1).trim();
  
  if (!timeReference) {
    return {
      message: input.trim(),
      isNaturalLanguage: false
    };
  }
  
  // Check for exact time first
  if (validateTimeFormat(timeReference)) {
    return {
      message,
      timestamp: formatTime(timeReference),
      isNaturalLanguage: false
    };
  }
  
  // Use chrono.parse for more detailed parsing
  try {
    const results = chrono.parse(timeReference);
    
    if (results.length > 0) {
      const result = results[0];
      const parsedDate = result.start.date();
      
      // Check if this is a future date
      if (isFutureDate(parsedDate)) {
        return {
          message,
          isNaturalLanguage: true,
          isFutureDate: true
        };
      }
      
      const hours = parsedDate.getHours().toString().padStart(2, '0');
      const minutes = parsedDate.getMinutes().toString().padStart(2, '0');
      const timestamp = `${hours}:${minutes}`;
      
      const targetFilename = getFilenameForDate(parsedDate);
      
      return {
        message,
        timestamp,
        targetDate: targetFilename,
        isNaturalLanguage: true
      };
    }
  } catch (error) {
    console.warn(`Failed to parse time reference: "${timeReference}"`, error);
  }
  
  return {
    message: input.trim(),
    isNaturalLanguage: false
  };
};

/**
 * Examples of what this enhanced parser can handle:
 * 
 * Input: "had lunch @an hour ago"
 * Output: { message: "had lunch", timestamp: "12:30", targetDate: "2025-06-07.md", isNaturalLanguage: true }
 * 
 * Input: "drank coffee @yesterday"
 * Output: { message: "drank coffee", timestamp: "12:00", targetDate: "2025-06-06.md", isNaturalLanguage: true }
 * 
 * Input: "morning standup @yesterday at 9am"
 * Output: { message: "morning standup", timestamp: "09:00", targetDate: "2025-06-06.md", isNaturalLanguage: true }
 * 
 * Input: "meeting prep @tomorrow"
 * Output: { message: "meeting prep", isNaturalLanguage: true, isFutureDate: true }
 * 
 * Input: "code review @14:30"
 * Output: { message: "code review", timestamp: "14:30", isNaturalLanguage: false }
 * 
 * Input: "just finished debugging"
 * Output: { message: "just finished debugging", isNaturalLanguage: false }
 */