import { App, Modal, Setting, Notice } from 'obsidian';
import { addLogEntryCore } from '../shared/core';
import { PluginConfig, AddEntryCommand } from '../shared/types';
import { createObsidianFileOperations } from './fileops';

export class QuickLogModal extends Modal {
  private message: string = '';
  private config: PluginConfig;
  
  constructor(app: App, config: PluginConfig) {
    super(app);
    this.config = config;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Create horizontal container
    const container = contentEl.createDiv();
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    container.style.padding = '10px';
    
    // Text input
    const textInput = container.createEl('input', {
      type: 'text',
      placeholder: 'What did you do?'
    });
    textInput.style.flex = '1';
    textInput.style.minWidth = '60ch';
    textInput.style.padding = '8px';
    textInput.style.border = '1px solid var(--background-modifier-border)';
    textInput.style.borderRadius = '4px';
    textInput.value = this.message;
    
    // Focus the input field
    textInput.focus();
    
    // Handle input changes
    textInput.addEventListener('input', (evt) => {
      this.message = (evt.target as HTMLInputElement).value;
    });
    
    // Handle enter key
    textInput.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        this.submitEntry();
      }
    });
    
    // Add button
    const addBtn = container.createEl('button', { 
      text: 'Add Entry',
      cls: 'mod-cta'
    });
    addBtn.addEventListener('click', () => {
      this.submitEntry();
    });
  }

  private async submitEntry() {
    if (!this.message.trim()) {
      new Notice('Please enter a message');
      return;
    }
    
    const command: AddEntryCommand = {
      message: this.message.trim()
    };
    
    const fileOps = createObsidianFileOperations(this.app);
    const result = await addLogEntryCore(command, this.config, fileOps);
    
    if (result.success) {
      const { entryAdded, totalEntries, isNewFile } = result.data;
      
      if (isNewFile) {
        new Notice(`Created daily note and added: ${entryAdded}`);
      } else {
        new Notice(`Added: ${entryAdded}`);
      }
      
      this.close();
    } else {
      new Notice(`Error: ${result.error.message}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}