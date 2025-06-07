import { App, TFile, TFolder } from 'obsidian';
import { FileOperations } from '../shared/core';

export const createObsidianFileOperations = (app: App): FileOperations => ({
  async exists(path: string): Promise<boolean> {
    // Remove leading slash and normalize path for Obsidian
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return app.vault.adapter.exists(normalizedPath);
  },

  async read(path: string): Promise<string> {
    // Remove leading slash and normalize path for Obsidian
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return app.vault.adapter.read(normalizedPath);
  },

  async write(path: string, content: string): Promise<void> {
    // Remove leading slash and normalize path for Obsidian
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Check if file exists
    const file = app.vault.getAbstractFileByPath(normalizedPath);
    
    if (file instanceof TFile) {
      // File exists, modify it
      await app.vault.modify(file, content);
    } else {
      // File doesn't exist, create it
      await app.vault.create(normalizedPath, content);
    }
  },

  async ensureDir(dirPath: string): Promise<void> {
    // Remove leading slash and normalize path for Obsidian
    const normalizedPath = dirPath.startsWith('/') ? dirPath.slice(1) : dirPath;
    
    // Check if directory exists
    const folder = app.vault.getAbstractFileByPath(normalizedPath);
    
    if (!folder) {
      // Create the directory path recursively
      const pathParts = normalizedPath.split('/').filter(part => part.length > 0);
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        const existingFolder = app.vault.getAbstractFileByPath(currentPath);
        if (!existingFolder) {
          await app.vault.createFolder(currentPath);
        }
      }
    }
  }
});