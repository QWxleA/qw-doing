import { App, TFile } from 'obsidian';
import { getDailyNoteFile } from './daily-note-utils';
import type { DailyNoteSettings } from '../main'; // adjust path if needed

/**
 * Retrieves the 'todaysThought' frontmatter value from the daily note of a given date.
 * 
 * @param date - A Moment.js date object representing the day to retrieve the thought for
 * @returns A Promise resolving to the 'todaysThought' string if found, or null if the note doesn't exist or lacks the property
 */
export async function getThoughtForDate(app: App, settings: DailyNoteSettings, date: moment.Moment): Promise<string | null> {
	const file = await getDailyNoteFile(app, settings, date);
	if (file) {
		return await getFrontmatterProperty(app, file, 'todaysThought');
	}
	return null;
}

/**
 * Updates a frontmatter property in a markdown file
 * @param app - Obsidian App instance
 * @param filePath - Full path to the file (or TFile object)
 * @param key - The frontmatter key to update
 * @param value - The value to set for the key
 * @returns Promise resolving to boolean indicating success
 */
export async function updateFrontmatterProperty(
  app: App,
  filePath: string | TFile,
  key: string,
  value: string | number | boolean | null
): Promise<boolean> {
  try {
    // Get the file object if a path was provided
    let file: TFile;
    if (typeof filePath === 'string') {
      const abstractFile = app.vault.getAbstractFileByPath(filePath);
      if (!abstractFile || !(abstractFile instanceof TFile)) {
        console.error(`File not found: ${filePath}`);
        return false;
      }
      file = abstractFile as TFile;
    } else {
      file = filePath;
    }

    // Read the file content
    const content = await app.vault.read(file);

    // Check if the file has frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    let newContent: string;

    if (match && match[1]) {
      // File has frontmatter
      const frontmatter = match[1];
      
      // Check if the key already exists in frontmatter
      const keyRegex = new RegExp(`^(${key}\\s*:).*$`, 'mi');
      const keyExists = keyRegex.test(frontmatter);

      let newFrontmatter: string;
      
      if (keyExists) {
        // Update existing key
        newFrontmatter = frontmatter.replace(
          keyRegex, 
          `$1 ${formatValue(value)}`
        );
      } else {
        // Add key to existing frontmatter
        newFrontmatter = `${frontmatter}\n${key}: ${formatValue(value)}`;
      }
      
      // Replace the frontmatter in the content
      newContent = content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---`);
    } else {
      // File has no frontmatter, add it
      newContent = `---\n${key}: ${formatValue(value)}\n---\n\n${content}`;
    }

    // Write the updated content back to the file
    await app.vault.modify(file, newContent);
    return true;
  } catch (error) {
    console.error('Error updating frontmatter:', error);
    return false;
  }
}

/**
 * Format a value for YAML frontmatter
 * @param value - The value to format
 * @returns Formatted string
 */
function formatValue(value: string | number | boolean | null): string {
  if (value === null) return 'null';
  
  if (typeof value === 'string') {
    // Check if string needs quotes (contains special chars)
    if (/[:#\[\]{}"']/g.test(value) || value.trim() !== value) {
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  
  // For numbers and booleans, just convert to string
  return String(value);
}

/**
 * Gets a frontmatter property from a markdown file
 * @param app - Obsidian App instance
 * @param filePath - Full path to the file (or TFile object)
 * @param key - The frontmatter key to retrieve
 * @returns Promise resolving to the property value or null if not found
 */
export async function getFrontmatterProperty(
  app: App,
  filePath: string | TFile,
  key: string
): Promise<string | null> {
  try {
    // Get the file object if a path was provided
    let file: TFile;
    if (typeof filePath === 'string') {
      const abstractFile = app.vault.getAbstractFileByPath(filePath);
      if (!abstractFile || !(abstractFile instanceof TFile)) {
        return null;
      }
      file = abstractFile as TFile;
    } else {
      file = filePath;
    }

    // Read the file content
    const content = await app.vault.read(file);

    // Extract frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (match && match[1]) {
      const frontmatter = match[1];
      
      // Look for the key in the frontmatter
      const keyRegex = new RegExp(`^${key}\\s*:\\s*(.*)$`, 'm');
      const keyMatch = frontmatter.match(keyRegex);
      
      if (keyMatch && keyMatch[1]) {
        // Return the value, trimmed of whitespace
        return keyMatch[1].trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting frontmatter property:', error);
    return null;
  }
}