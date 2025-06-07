# qw-2do - Quick Logger for Obsidian

A simple, functional logging tool that works both as an Obsidian plugin and a command-line utility. Quickly add timestamped entries to your daily notes with automatic chronological sorting.

## Features

- **Dual Interface**: Works as both an Obsidian plugin and CLI tool
- **Shared Codebase**: Core functionality shared between both implementations
- **Automatic Timestamps**: Entries are automatically timestamped and sorted chronologically
- **Simple Modal**: Clean, focused interface for quick logging
- **Daily Note Integration**: Works with standard Obsidian daily note format
- **Functional Code Style**: Clean, functional TypeScript implementation

## Installation

### Plugin Installation

1. Copy the built plugin files to your Obsidian vault's plugins folder:
   ```
   .obsidian/plugins/2do-quick-logger/
   ```

2. Enable the plugin in Obsidian Settings → Community Plugins

### CLI Installation

1. Build the CLI:
   ```bash
   npm run build-cli
   ```

2. Link the CLI tool:
   ```bash
   npm run link-cli
   ```

This creates a symlink at `$HOME/bin/2do` pointing to the built CLI.

## Usage

### Obsidian Plugin

- **Ribbon Icon**: Click the calendar-plus icon in the left ribbon
- **Command Palette**: Search for "2do" or "Add quick log entry"
- **Hotkey**: Set a custom hotkey in Settings → Hotkeys

### CLI Usage

```bash
# Add a quick entry
2do "Had a productive meeting with the team"

# Add an entry with custom timestamp
2do -t 09:30 "Morning standup completed"

# List today's entries
2do -l
2do --list

# Show help
2do -h
2do --help
```

## Project Structure

```
qw-2do/
├── src/
│   ├── shared/           # Shared library
│   │   ├── core.ts      # Core logging functions
│   │   ├── types.ts     # Type definitions
│   │   └── utils.ts     # Utility functions
│   ├── cli/             # CLI implementation
│   │   └── cli.ts       # CLI entry point
│   ├── plugin/          # Obsidian plugin
│   │   ├── main.ts      # Plugin main file
│   │   ├── modal.ts     # Modal component
│   │   └── fileops.ts   # Obsidian file operations
│   └── manifest.json    # Plugin manifest
├── dist/                # Built files
├── package.json
├── tsconfig.json        # Base TypeScript config
├── tsconfig.cli.json    # CLI-specific config
├── tsconfig.plugin.json # Plugin-specific config
└── esbuild.config.mjs   # Plugin build config
```

## Configuration

### Plugin Settings

- **Journal Directory**: Relative path to your journal folder (default: "Journal")
- **Today Header**: Header text to look for (default: "## Today")

### CLI Configuration

Edit the `DEFAULT_CONFIG` in `src/cli/cli.ts`:

```typescript
const DEFAULT_CONFIG: LoggerConfig = {
  journalDir: process.env.HOME + '/Documents/ThirdTime/Journal',
  todayHeader: '## Today'
};
```

## Daily Note Format

The tool expects daily notes with this structure:

```markdown
# 2024-01-15

## Today

- **09:30** Morning standup completed
- **11:45** Had a productive meeting with the team
- **14:20** Code review session

## Other sections...
```

## Development

### Building

```bash
# Build everything
npm run build

# Build CLI only
npm run build-cli

# Build plugin only (for development)
npm run dev

# Build plugin for production
npm run build
```

### Architecture

The project uses a functional approach with:

- **Shared Core**: Pure functions for logging operations
- **File Operations Interface**: Abstraction layer for different file systems
- **Type Safety**: Comprehensive TypeScript types
- **Error Handling**: Result types for better error management

### Key Functions

#### Core Functions (`src/shared/core.ts`)

- `addLogEntryCore()`: Adds a timestamped entry to today's note
- `listTodayEntriesCore()`: Retrieves all entries from today's note

#### Utility Functions (`src/shared/utils.ts`)

- `getTodayFilename()`: Generates today's filename (YYYY-MM-DD.md)
- `getCurrentTime()`: Gets current time in HH:mm format
- `parseLogEntry()`: Parses log entry lines
- `compareTimeStrings()`: Sorts entries chronologically

## File Operations

The project abstracts file operations through the `FileOperations` interface:

```typescript
interface FileOperations {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  ensureDir(path: string): Promise<void>;
}
```

- **CLI**: Uses Node.js `fs` module
- **Plugin**: Uses Obsidian's Vault API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the functional style
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.