# Cantrip

Language support for the Cantrip scripting language.

## Installation

This extension is not currently published on the vscode marketplace so installation is done manually for the time being.

### Prerequisites

- Git
- `vsce` (installed via `npm install -g @vscode/vsce`, or run via `npx`)
- Visual Studio Code, VS Codium, Cursor, or another VS Code fork

### Instructions

#### Build

```bash
# 1. Clone the monorepo
git clone https://github.com/StormbringerDev/cantrip.git

# 2. Move to editor directory
cd cantrip/editors/vscode

# 3. Build the .vsix file
npx vsce package
```

#### GUI Installation

1. Open the Command Palette in your editor of choice (Mac: `Cmd+Shift+P` Windows/Linux: `Ctrl+Shift+P`)
2. Type "Extensions: Install from VSIX..." and enter the command
3. Navigate to the built `cantrip-X.X.X.vsix file` and select it

#### Command Line Installation

```bash
# Ensure the command matches your preferred editor (`codium`, `cursor`, etc.)
code --install-extension /path/to/cantrip-X.X.X.vsix
```
