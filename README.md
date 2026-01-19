# Quick Read Card ⚡️

[English](./README.md) | [中文说明](./README.zh-CN.md)

**Quick Read Card** is a minimalist, high-speed data labeling tool. It converts each row of an Excel or Markdown table into a card, allowing you to categorize data at lightning speed using arrow keys.

![Demo Screenshot](./demo.webp)

## ✨ Features

- **Minimalist Monochrome UI**: Focused on content with zero distractions, no animations, and maximum responsiveness.
- **Excel/TSV Support**: Directly paste content copied from Excel, WPS, or Google Sheets (Tab-separated).
- **Full Keyboard Control**: Label using `↑` `↓` `←` `→` keys. Card switching is instantaneous.
- **Custom Labels**: Flexibly define categories for each of the four arrow keys.
- **Fast Export**: Export to Markdown tables or use "Copy for Excel" to paste results directly back into your spreadsheet.

## 🚀 Download & Use (Releases)

If you just want to use the app, please go to the [Releases](https://github.com/cheercheung/lyj-quick-read-card/releases) page to download:
- **macOS**: Download the `.dmg` or `.zip` file.
- **Windows**: Download the `Portable` version.

## 🛠 Development & Building

To modify or build the project yourself:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Launch Locally**:
   ```bash
   npm start
   ```
3. **Build for Distribution (macOS)**:
   ```bash
   npm run package
   ```

## ⚙️ Implementation Highlights

- **High-Performance Parser**: Automatic detection of Tab (Excel) and Pipe (Markdown) formats.
- **Extreme Responsiveness**: Removed all swipe animations and interaction delays for zero-lag feedback.
- **Electron Powered**: Leverages Electron to turn web technologies into a native, lightweight macOS application.

## ⌨️ Keyboard Shortcuts

- **↑ / ↓ / ← / →**: Custom labeling categories.
- **After labeling**: Automatically enter the results page for preview and export.

## 📄 License

Open source under the [MIT](./LICENSE) license.
