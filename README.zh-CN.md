# Quick Read Card ⚡️

[English](./README.md) | [中文说明](./README.zh-CN.md)

**Quick Read Card** 是一款极简、高效率的数据标注工具。它能将 Excel 或 Markdown 表格的每一行转换为卡片，让你通过键盘方向键实现极速分类标注。

![Demo Screenshot](https://via.placeholder.com/800x450.png?text=Quick+Read+Card+UI)

## ✨ 特性

- **极简黑白视觉**：专注内容，无干扰，无动画，追求极致响应速度。
- **Excel/TSV 支持**：直接粘贴从 Excel、WPS 或 Google Sheets 复制的内容。
- **全键盘操作**：使用 `↑` `↓` `←` `→` 进行标注，卡片切换瞬间完成。
- **自定义标签**：用户可灵活定义四个按键对应的分类。
- **快速导出**：一键导出 Markdown 表格，或点击 "Copy for Excel" 直接贴回表格软件。

## 🚀 下载使用 (Releases)

如果你只想使用程序，请前往 [Releases](https://github.com/your-username/lyj-quick-read-card/releases) 页面下载适合你系统的版本：
- **macOS**: 下载 `.dmg` 或 `.zip` 文件。
- **Windows**: 下载 `Portable` 版本即开即用（即将推出）。

## 🛠 开发与构建

如果要自行修改或构建：

1. **安装依赖**:
   ```bash
   npm install
   ```
2. **本地启动**:
   ```bash
   npm start
   ```
3. **分发打包 (macOS)**:
   ```bash
   npm run package
   ```

## ⌨️ 快捷键说明

- **↑ / ↓ / ← / →**: 对应的自定义分类标注。
- **标注完成后**: 自动进入结果页面，支持预览和导出。

## 📄 开源协议

基于 [MIT](./LICENSE) 协议开源。
