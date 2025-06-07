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
    
    contentEl.createEl('h2', { text: '2do - Quick Log Entry' });
    
    // Message input
    new Setting(contentEl)
      .setName('Log Message')
      .setDesc('Enter your log entry')
      .addText(text => {
        text
          .setPlaceholder('What did you do?')
          .setValue(this.message)
          .onChange(value => {
            this.message = value;
          });
        
        // Focus the input field
        text.inputEl.focus();
        
        // Handle enter key
        text.inputEl.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault();
            this.submitEntry();
          }
        });
      });
    
    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';
    
    // Cancel button
    const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => {
      this.close();
    });
    
    // Add button
    const addBtn = buttonContainer.createEl('button', { 
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