import { Plugin, Notice } from 'obsidian';
import { QuickLogModal } from './modal';
import { PluginConfig } from '../shared/types';
import { QwDoingSettingTab, QwDoingSettings, DEFAULT_SETTINGS } from './settings';

export default class QwDoingPlugin extends Plugin {
  settings: QwDoingSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new QwDoingSettingTab(this.app, this));

    // Add ribbon icon
    const ribbonIconEl = this.addRibbonIcon('calendar-plus', 'qw-doing - Quick Log', (evt: MouseEvent) => {
      this.openQuickLogModal();
    });
    ribbonIconEl.addClass('qw-doing-ribbon-icon');

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

    console.log('qw-doing plugin loaded');
  }

  onunload() {
    console.log('qw-doing plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openQuickLogModal() {
    const config: PluginConfig = {
      vaultPath: '',
      journalDir: this.settings.journalDir,
      todayHeader: this.settings.todayHeader,
      dateFormat: this.settings.dateFormat,
      timeFormat: this.settings.timeFormat
    };

    new QuickLogModal(this.app, config).open();
  }
}