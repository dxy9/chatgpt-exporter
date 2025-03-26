# ChatGPT Exporter 技术文档

本文档对 ChatGPT Exporter 浏览器脚本的技术实现进行详细说明，便于开发者理解项目架构并应用到其他类似网站。

## 目录

- [项目简介](#项目简介)
- [核心实现](./core-implementation.md)
- [核心流程](./core-process.md)
- [调用链条](./call-chain.md)
- [迁移指南](./migration-guide.md)

## 项目简介

ChatGPT Exporter 是一个浏览器用户脚本（UserScript），用于从 ChatGPT 网页版导出对话内容，支持多种格式：

- 纯文本 (Text)
- HTML
- Markdown
- 截图 (PNG)
- JSON

该脚本通过注入到 ChatGPT 页面中，能够访问页面数据、调用 ChatGPT API 并将对话内容导出为用户选择的格式。

## 技术栈

- TypeScript - 主要编程语言
- Preact - UI 框架
- Vite - 构建工具
- Tailwind CSS - 样式框架
- JSZip - 用于创建 ZIP 文件

## 安装和使用

关于项目的安装和使用方法，请参考项目根目录的 README.md 文件。

## 文档结构

本文档分为以下几个主要部分：

1. **核心实现** - 详细介绍项目的核心技术实现和架构
2. **核心流程** - 说明导出功能的执行流程和关键步骤
3. **调用链条** - 梳理函数调用关系，方便理解代码执行路径
4. **迁移指南** - 提供将此功能迁移到其他类似网站的指导建议

## 贡献

欢迎贡献代码或改进文档。请参考项目根目录的 CONTRIBUTING.md 文件了解贡献指南。 