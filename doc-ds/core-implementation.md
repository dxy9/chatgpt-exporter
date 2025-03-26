# ChatGPT导出器核心实现

```text
.
├── src/
│   ├── main.tsx - 应用主入口
│   │   ├── 主函数main()
│   │   │   ├── 初始化样式和菜单容器
│   │   │   ├── 使用sentinel监听导航栏变化
│   │   │   ├── 定时清理无效容器
│   │   │   └── 共享页面特殊处理
│   │   ├── 消息时间戳功能
│   │   │   ├── 监听对话变化
│   │   │   ├── 获取对话ID
│   │   │   ├── 获取对话内容
│   │   │   └── 添加时间戳DOM元素
│   │   └── getMenuContainer()
│   │       ├── 创建菜单容器
│   │       └── 渲染Menu组件
│   ├── api.ts - 核心API
│   │   ├── 获取对话列表
│   │   ├── 导出对话处理
│   │   └── 与ChatGPT接口交互
│   ├── page.ts - 页面逻辑
│   │   ├── 处理用户交互
│   │   └── 管理对话状态
│   ├── exporter/ - 导出器实现
│   │   ├── html.ts - HTML导出
│   │   │   ├── 生成HTML结构
│   │   │   └── 样式处理
│   │   ├── image.ts - 图片导出
│   │   ├── json.ts - JSON导出
│   │   ├── markdown.ts - Markdown导出
│   │   └── text.ts - 纯文本导出
│   ├── ui/ - UI组件
│   │   ├── ExportDialog.tsx - 导出对话框
│   │   │   ├── 导出格式选择
│   │   │   └── 导出选项配置
│   │   ├── SettingDialog.tsx - 设置对话框
│   │   └── 其他基础组件...
│   ├── utils/ - 工具函数
│   │   ├── clipboard.ts - 剪贴板操作
│   │   ├── download.ts - 文件下载
│   │   └── 其他工具...
│   └── locales/ - 国际化资源
│       └── 多语言JSON文件
├── vite.config.ts - 构建配置
└── package.json - 项目依赖和脚本
```

## 核心模块说明

### 1. 主入口 (main.tsx)
- 初始化React应用
- 配置主题和国际化
- 挂载主界面组件

### 2. 导出功能 (exporter/)
- 支持多种导出格式：HTML, Markdown, JSON等
- 每种格式有独立的处理器
- 统一的导出接口设计

### 3. UI组件 (ui/)
- 基于React的函数组件
- 使用CSS模块化样式
- 包含对话框、菜单等交互组件

### 4. 工具函数 (utils/)
- 提供剪贴板、下载等浏览器API封装
- 包含文本处理和格式转换工具
