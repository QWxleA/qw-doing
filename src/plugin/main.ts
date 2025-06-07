import { Plugin, Notice } from 'obsidian';
import { QuickLogModal } from './modal';
import { PluginConfig } from '../shared/types';

interface TwoDoPluginSettings {
  journalDir: string;
  todayHeader: string;
}

const DEFAULT_SETTINGS: TwoDoPluginSettings = {
  journalDir: 'Journal',
  todayHeader: '## Today'
};

export default class TwoDoPlugin extends Plugin {
  settings: TwoDoPluginSettings;

  async onload() {
    await this.loadSettings();

    // Add ribbon icon
    const ribbonIconEl = this.addRibbonIcon('calendar-plus', '2do - Quick Log', (evt: MouseEvent) => {
      this.openQuickLogModal();
    });
    ribbonIconEl.addClass('2do-ribbon-icon');

    // Add command
    this.addCommand({
      id: 'open-quick-log',
      name: 'Add quick log entry',
      callback: () => {
        this.openQuickLogModal();
      }
    });

    // Add command palette entry
    this.addCommand({
      id: 'quick-2do',
      name: '2do',
      callback: () => {
        this.openQuickLogModal();
      }
    });

    console.log('2do plugin loaded');
  }

  onunload() {
    console.log('2do plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openQuickLogModal() {
    const config: PluginConfig = {
      vaultPath: this.app.vault.adapter.basePath || '',
      journalDir: this.settings.journalDir,
      todayHeader: this.settings.todayHeader,
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm'
    };

    new QuickLogModal(this.app, config).open();
  }
}