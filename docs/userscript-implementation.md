# ChatGPT Exporter 油猴脚本安装与工作原理

本文档介绍 ChatGPT Exporter 作为油猴脚本的安装机制和工作原理，以及迁移到其他网站时需要注意的关键点。

## 安装机制概述

ChatGPT Exporter 作为一个油猴脚本（UserScript）是通过浏览器扩展程序（如 Tampermonkey）来实现安装和运行的。以下是详细的安装机制和工作原理：

```
油猴安装与执行流程
├── 用户从Greasyfork或GitHub获取脚本
├── Tampermonkey解析脚本元数据和代码
├── 脚本被保存到浏览器扩展的存储中
└── 根据@match规则在匹配的网页上自动执行
```

## 脚本元数据

油猴脚本通过元数据块（metadata block）来声明其功能和权限，位于脚本顶部，由 `// ==UserScript==` 和 `// ==/UserScript==` 标记包围：

```javascript
// ==UserScript==
// @name         ChatGPT Exporter
// @namespace    https://github.com/pionxzh
// @version      x.x.x
// @description  Export and Save your ChatGPT conversation
// @author       pionxzh
// @match        https://chat.openai.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
```

关键元数据说明：
- `@match`: 定义脚本在哪些URL上运行，这里是ChatGPT网站
- `@grant`: 声明需要使用的油猴API权限
- `@run-at`: 指定脚本运行的时机，这里是页面加载完成后

## 构建与生成过程

ChatGPT Exporter 项目使用 Vite 构建工具配合 vite-plugin-monkey 插件来生成用户脚本：

```
构建过程
├── 源代码（TypeScript、Preact等）
├── Vite构建流程
│   ├── vite-plugin-monkey处理
│   │   ├── 生成脚本元数据
│   │   ├── 打包依赖库
│   │   └── 内联样式和资源
│   ├── 代码转译和压缩
│   └── 生成最终脚本
└── 输出到dist/chatgpt.user.js
```

## 脚本初始化与执行

当用户访问 `https://chat.openai.com/*` 时，脚本会自动执行：

```
脚本执行流程
├── 油猴环境注入脚本到页面
├── main()函数执行
│   ├── onloadSafe()确保DOM准备就绪
│   ├── 注入样式和UI组件
│   ├── 设置DOM监听器（sentinel-js）
│   │   ├── 监听导航菜单出现
│   │   ├── 监听共享页面特定元素
│   │   └── 监听消息区域变化
│   └── 定期检查DOM变化以适应页面更新
└── 等待用户交互
```

## 油猴API使用

这个脚本使用了几个关键的油猴API来增强功能：

```
油猴API调用
├── GM_addStyle() - 添加CSS样式到页面
├── GM_setValue() - 保存用户设置
│   └── 在ScriptStorage类中封装使用
├── GM_getValue() - 读取用户设置
│   └── 在ScriptStorage类中封装使用
└── GM_registerMenuCommand() - 注册右键菜单项
```

## 示例：脚本初始化代码

这是在油猴环境中初始化脚本的关键代码段简化示例：

```typescript
// 脚本入口点
(function() {
    'use strict';
    
    // 主函数
    function main() {
        onloadSafe(() => {
            // 添加样式
            const styleEl = document.createElement('style');
            styleEl.id = 'sentinel-css';
            document.head.append(styleEl);
            
            // 设置DOM监听
            sentinel.on('nav', injectNavMenu);
            
            // 定期检查DOM变化
            setInterval(() => {
                // 维护注入的UI元素
                // 检查新的导航元素
            }, 300);
            
            // 处理共享页面
            if (isSharePage()) {
                sentinel.on(`div[role="presentation"] > .w-full > div >.flex.w-full`, (target) => {
                    target.prepend(getMenuContainer());
                });
            }
            
            // 其他初始化代码...
        });
    }
    
    // 启动脚本
    main();
})();
```

## 与其他页面集成

要将此脚本迁移到其他类似网站，需要调整以下几个关键配置点：

```
迁移关键点
├── 修改@match规则以匹配新网站URL
├── 调整DOM选择器（sentinel.on参数）
│   ├── 找到合适的导航菜单注入点
│   └── 适配消息内容获取选择器
├── 更新API交互函数
│   ├── 修改getChatIdFromUrl()函数
│   ├── 调整getPageAccessToken()函数
│   └── 更新API端点URL
└── 可能需要重新设计数据处理流程
```

## 存储与配置

脚本通过油猴的存储API保存用户设置和首选项：

```
数据存储
├── ScriptStorage封装类
│   ├── ScriptStorage.get() - 获取设置
│   ├── ScriptStorage.set() - 保存设置
│   └── ScriptStorage.remove() - 删除设置
└── 存储内容
    ├── 导出格式设置
    ├── 时间戳显示设置
    ├── 文件名格式配置
    └── 其他用户首选项
```

## vite.config.ts 与脚本构建

项目通过 vite.config.ts 文件配置脚本的构建规则，主要使用 vite-plugin-monkey 插件处理：

```typescript
// vite.config.ts 简化示例
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
    plugins: [
        preact(),
        monkey({
            entry: 'src/main.tsx',
            userscript: {
                name: 'ChatGPT Exporter',
                namespace: 'https://github.com/pionxzh',
                match: ['https://chat.openai.com/*'],
                grant: [
                    'GM_addStyle',
                    'GM_setValue',
                    'GM_getValue',
                    'GM_registerMenuCommand',
                ],
                run-at: 'document-idle',
            },
            build: {
                externalGlobals: {
                    preact: cdn.jsdelivr('preact', 'dist/preact.min.js'),
                    // 其他外部依赖...
                },
            },
        }),
    ],
    // 其他配置...
})
```

通过这种方式，ChatGPT Exporter 能够在油猴环境中稳定运行，并提供丰富的功能，同时保持用户设置的持久性。要将其迁移到其他网站，主要需要关注DOM选择器和API交互部分的调整。 