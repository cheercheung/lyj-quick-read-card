# AGENTS.md

This document provides guidelines for AI agents working in this repository.

## Project Overview

QuickReadCard is a minimalist Electron-based desktop application for rapid data labelling. Users paste tables (Excel/TSV/Markdown), configure label keys, and categorize rows using arrow keys.

## Build Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Build production bundle
npm run preview    # Preview production build
npm start          # Run Electron app (uses local files, not built)
npm run package    # Build macOS DMG/ZIP installer
npm run release    # Build for macOS/Windows/Linux
```

**Note:** This project has no test suite. Before committing, manually verify:
- App launches correctly
- Table parsing works for TSV, Markdown, and single-column formats
- Export features generate correct Markdown/TSV output

## Code Style Guidelines

### General Principles

- Keep functions small and focused (under 50 lines when possible)
- Use descriptive variable names; avoid single letters except loop indices
- Structure code with clear section comments (e.g., `// --- Step 1: Parsing ---`)
- Prefer early returns to reduce nesting

### JavaScript Conventions

- **Module System:** Use CommonJS (`require()`) - this is a CommonJS project
- **Imports:** Group imports: Electron APIs first, Node built-ins second, local files third
- **Formatting:** 4-space indentation (as used throughout codebase)
- **Strings:** Use double quotes for consistency
- **Semicolons:** Use semicolons at statement ends
- **Constants:** Use `const` by default; `let` only when reassignment is necessary

### Naming Conventions

- Variables/functions: `camelCase` (e.g., `tableData`, `startLabelling`)
- Constants: `SCREAMING_SNAKE_CASE` for configuration objects (e.g., `DEFAULT_CONFIG`)
- DOM IDs: `kebab-case` matching HTML (e.g., `btn-parse`, `step-1`)
- Descriptive names preferred over abbreviations (use `contentColumnIndex` not `colIdx`)

### Error Handling

- Validate user input with early returns and `alert()` for user-facing errors
- Check for undefined values before accessing properties
- Use optional chaining (`?.`) when property access might fail

### Security (Electron)

- Always set `nodeIntegration: false` and `contextIsolation: true` in webPreferences
- Use `contextBridge` via `preload.js` if IPC is needed (not currently used)
- Never expose Node.js modules to the renderer process

### CSS Guidelines

- Use CSS variables for theming (see `style.css`)
- Prefix class names descriptively (e.g., `glass-pane`, `card-display`)
- Keep styles minimal; prefer semantic HTML structure

## Architecture

```
root/
├── main.js           # Electron main process (app lifecycle, window creation)
├── app.js            # Renderer process (UI logic, event handlers)
├── preload.js        # IPC bridge (create if contextBridge needed)
├── index.html        # Main HTML structure
├── style.css         # Application styles
├── package.json      # Dependencies and build config
└── dist/             # Build output (generated)
```

## Key State Management

The renderer uses module-level variables for state:
- `tableData`: { headers: string[], rows: string[][] }
- `config`: { contentColIndex: number, labels: { ArrowUp/Down/Left/Right: string } }
- `currentIndex`: number (current row position)
- `results`: string[] (assigned labels)

## Common Tasks

### Adding a New Step
1. Add HTML section in `index.html` with unique ID
2. Add ID to `stages` array in `app.js`
3. Use `showStage()` to control visibility
4. Add styles in `style.css` if needed

### Adding Export Format
1. Create `generateFormatName()` function in `app.js`
2. Add export button listener
3. Use `Blob` + `URL.createObjectURL()` pattern

### Modifying Label Keys
1. Update `config.labels` in `app.js`
2. Update UI hints in Step 2
3. Update keyboard handler in `keydown` listener
