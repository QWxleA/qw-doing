import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LoggerConfig } from '../shared/types';

export interface CliConfig extends LoggerConfig {
  // CLI-specific config can be added here
}

/**
 * Default configuration with reasonable fallbacks
 */
const getDefaultConfig = (): CliConfig => ({
  journalDir: path.join(os.homedir(), 'Documents', 'ThirdTime', 'Journal'),
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  todayHeader: '## Today'
});

/**
 * Possible config file locations (in order of preference)
 */
const getConfigPaths = (): string[] => {
  const homeDir = os.homedir();
  return [
    path.join(homeDir, '.qw-doing.json'),           // ~/.qw-doing.json
    path.join(homeDir, '.config', 'qw-doing.json'), // ~/.config/qw-doing.json
    path.join(process.cwd(), '.qw-doing.json'),     // ./.qw-doing.json (current directory)
  ];
};

/**
 * Loads configuration from file, falling back to defaults
 */
export const loadCliConfig = (): CliConfig => {
  const defaultConfig = getDefaultConfig();
  const configPaths = getConfigPaths();
  
  // Try to load from each config file location
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(configContent);
        
        // Merge user config with defaults
        const mergedConfig = { ...defaultConfig, ...userConfig };
        
        console.log(`📄 Loaded config from: ${configPath}`);
        return mergedConfig;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${configPath}:`, (error as Error).message);
    }
  }
  
  // No config file found, use defaults
  console.log(`📄 Using default configuration (no config file found)`);
  console.log(`💡 Create ${configPaths[0]} to customize settings`);
  
  return defaultConfig;
};

/**
 * Creates a sample config file
 */
export const createSampleConfig = (configPath?: string): void => {
  const targetPath = configPath || getConfigPaths()[0];
  const sampleConfig = getDefaultConfig();
  
  // Add comments as a comment object (will be ignored when parsing)
  const configWithComments = {
    $schema: "Configuration for qw-doing CLI tool",
    journalDir: sampleConfig.journalDir,
    todayHeader: sampleConfig.todayHeader,
    dateFormat: sampleConfig.dateFormat,
    timeFormat: sampleConfig.timeFormat,
    $comments: {
      journalDir: "Absolute path to your journal directory",
      todayHeader: "Header text to look for in daily notes",
      dateFormat: "Date format for filenames (currently only YYYY-MM-DD supported)",
      timeFormat: "Time format for entries (currently only HH:mm supported)"
    }
  };
  
  try {
    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, JSON.stringify(configWithComments, null, 2));
    console.log(`✅ Created sample config file: ${targetPath}`);
    console.log(`📝 Edit this file to customize your settings`);
  } catch (error) {
    console.error(`❌ Failed to create config file: ${(error as Error).message}`);
  }
};

/**
 * Validates that the configured journal directory exists
 */
export const validateConfig = (config: CliConfig): boolean => {
  if (!fs.existsSync(config.journalDir)) {
    console.error(`❌ Journal directory does not exist: ${config.journalDir}`);
    console.error(`💡 Either create the directory or update your config file`);
    return false;
  }
  
  try {
    fs.accessSync(config.journalDir, fs.constants.W_OK);
  } catch (error) {
    console.error(`❌ Journal directory is not writable: ${config.journalDir}`);
    return false;
  }
  
  return true;
};