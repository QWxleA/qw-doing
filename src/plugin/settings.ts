import { App, PluginSettingTab, Setting } from 'obsidian';
import QwDoingPlugin from './main';

export interface QwDoingSettings {
  journalDir: string;
  todayHeader: string;
  dateFormat: string;
  timeFormat: string;
}

export const DEFAULT_SETTINGS: QwDoingSettings = {
  journalDir: 'Journal',
  todayHeader: '## Today',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm'
};

export class QwDoingSettingTab extends PluginSettingTab {
  plugin: QwDoingPlugin;

  constructor(app: App, plugin: QwDoingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'qw-doing Settings' });

    // Journal Directory Setting
    new Setting(containerEl)
      .setName('Journal Directory')
      .setDesc('Path to your journal folder (relative to vault root)')
      .addText(text => text
        .setPlaceholder('Journal')
        .setValue(this.plugin.settings.journalDir)
        .onChange(async (value) => {
          this.plugin.settings.journalDir = value || 'Journal';
          await this.plugin.saveSettings();
        }));

    // Today Header Setting
    new Setting(containerEl)
      .setName('Today Section Header')
      .setDesc('The header text to look for in daily notes where entries will be added')
      .addText(text => text
        .setPlaceholder('## Today')
        .setValue(this.plugin.settings.todayHeader)
        .onChange(async (value) => {
          this.plugin.settings.todayHeader = value || '## Today';
          await this.plugin.saveSettings();
        }));

    // Date Format Setting
    new Setting(containerEl)
      .setName('Date Format')
      .setDesc('Format for daily note filenames (currently only YYYY-MM-DD is supported)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.settings.dateFormat)
        .setDisabled(true) // Disabled since we only support one format currently
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value || 'YYYY-MM-DD';
          await this.plugin.saveSettings();
        }));

    // Time Format Setting
    new Setting(containerEl)
      .setName('Time Format')
      .setDesc('Format for timestamps in entries (currently only HH:mm is supported)')
      .addText(text => text
        .setPlaceholder('HH:mm')
        .setValue(this.plugin.settings.timeFormat)
        .setDisabled(true) // Disabled since we only support one format currently
        .onChange(async (value) => {
          this.plugin.settings.timeFormat = value || 'HH:mm';
          await this.plugin.saveSettings();
        }));

    // Add information section
    containerEl.createEl('h3', { text: 'CLI Configuration' });
    
    const cliInfo = containerEl.createDiv();
    cliInfo.innerHTML = `
      <p>To configure the CLI tool, create a config file at:</p>
      <code>~/.qw-doing.json</code>
      <p>Example configuration:</p>
      <pre>{
  "journalDir": "/path/to/your/journal",
  "todayHeader": "## Today",
  "dateFormat": "YYYY-MM-DD",
  "timeFormat": "HH:mm"
}</pre>
      <p>The CLI will fall back to default values if the config file doesn't exist.</p>
    `;
    cliInfo.style.backgroundColor = 'var(--background-secondary)';
    cliInfo.style.padding = '10px';
    cliInfo.style.borderRadius = '4px';
    cliInfo.style.marginTop = '10px';
  }
}