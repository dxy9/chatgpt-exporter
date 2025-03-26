# 核心实现

本文档详细介绍了 ChatGPT Exporter 的核心技术实现和架构设计。

## 代码结构

项目的源代码结构如下：

```
src/
├── api.ts              // API 相关函数，用于与ChatGPT API交互
├── constants.ts        // 常量定义
├── exporter/           // 导出功能实现
│   ├── html.ts         // HTML导出实现
│   ├── image.ts        // 图片导出实现
│   ├── json.ts         // JSON导出实现
│   ├── markdown.ts     // Markdown导出实现
│   └── text.ts         // 文本导出实现
├── hooks/              // React Hooks
├── i18n.ts             // 国际化实现
├── locales/            // 语言包
├── main.tsx            // 主入口文件
├── page.ts             // 页面操作相关函数
├── styles/             // 样式文件
├── template.html       // HTML导出模板
├── type.ts             // 类型定义
├── ui/                 // UI组件
└── utils/              // 工具函数
```

## 关键模块

### 1. 入口点 (main.tsx)

用户脚本的入口点，负责初始化脚本并将UI组件注入到ChatGPT页面中。主要功能：

- 监听页面导航事件
- 使用sentinel.js库检测DOM元素
- 注入导出按钮UI

### 2. API交互 (api.ts)

负责与ChatGPT API的交互，提供以下关键功能：

- 获取当前会话ID
- 获取会话内容
- 提取会话结构
- 处理多模态内容（如图片、代码等）

### 3. 页面操作 (page.ts)

提供与ChatGPT页面交互的功能：

- 从URL中获取会话ID
- 获取用户信息
- 检测共享页面
- 获取用户头像

### 4. 导出功能实现 (exporter/)

包含各种导出格式的实现：

#### 文本导出 (text.ts)
将对话转换为纯文本格式，支持时间戳和角色标记。

#### HTML导出 (html.ts)
创建HTML文档，包含样式和格式化内容，可在浏览器中直接查看。

#### Markdown导出 (markdown.ts)
将对话转换为Markdown格式，支持代码块、LaTeX数学公式和脚注。

#### 图片导出 (image.ts)
将对话内容截图为PNG图像。

#### JSON导出 (json.ts)
导出原始JSON数据。

### 5. 用户界面 (ui/)

使用Preact实现的用户界面组件：

- 导出菜单
- 导出设置
- 批量导出对话
- 语言选择

### 6. 工具函数 (utils/)

提供各种辅助功能：

- DOM操作
- 下载文件
- 日期格式化
- Markdown处理
- 存储操作

## 关键技术点

### 页面注入

脚本使用 `sentinel-js` 库来监视DOM变化并注入UI元素。这种方式允许脚本在页面加载完成后动态插入导出按钮。

### 数据提取

数据提取采用两种方式：
1. 从页面DOM获取对话内容
2. 通过ChatGPT API获取完整对话数据

### 导出格式化

各种导出格式都实现了自己的格式化逻辑，处理不同类型的内容（文本、代码、图片等）。

### 国际化支持

使用i18n实现多语言支持，便于全球用户使用。

## 代码示例

### 注入导出按钮

```typescript
function main() {
    onloadSafe(() => {
        const styleEl = document.createElement('style')
        styleEl.id = 'sentinel-css'
        document.head.append(styleEl)

        const injectionMap = new Map<HTMLElement, HTMLElement>()

        const injectNavMenu = (nav: HTMLElement) => {
            if (injectionMap.has(nav)) return

            const container = getMenuContainer()
            injectionMap.set(nav, container)

            const chatList = nav.querySelector(':scope > div.overflow-y-auto, :scope > div.overflow-y-hidden')
            if (chatList) {
                chatList.after(container)
            }
            else {
                // fallback to the bottom of the nav
                nav.append(container)
            }
        }

        sentinel.on('nav', injectNavMenu)
        // ... 其他代码
    })
}
```

### 导出Markdown示例

```typescript
export async function exportToMarkdown(fileNameFormat: string, metaList: ExportMeta[]) {
    if (!checkIfConversationStarted()) {
        alert(i18n.t('Please start a conversation first'))
        return false
    }

    const chatId = await getCurrentChatId()
    const rawConversation = await fetchConversation(chatId, true)
    const conversation = processConversation(rawConversation)
    const markdown = conversationToMarkdown(conversation, metaList)

    const fileName = getFileNameWithFormat(fileNameFormat, 'md', { 
        title: conversation.title, 
        chatId, 
        createTime: conversation.createTime, 
        updateTime: conversation.updateTime 
    })
    downloadFile(fileName, 'text/markdown', standardizeLineBreaks(markdown))

    return true
}
```

## 扩展性设计

项目的架构设计考虑了扩展性：

1. **格式模块化**: 各种导出格式独立实现，便于添加新格式
2. **API抽象**: 与ChatGPT API交互的函数被抽象，便于适应API变化
3. **UI组件化**: 使用Preact组件化UI，便于添加新功能
4. **工具函数分离**: 通用功能抽离为工具函数，便于复用

这种设计使得将脚本迁移到其他类似网站变得更加容易。 