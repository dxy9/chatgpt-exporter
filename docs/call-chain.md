# 调用链条

本文档详细梳理了 ChatGPT Exporter 中的主要函数调用链条，有助于理解代码的执行流程和各模块间的依赖关系。

## 脚本初始化

脚本初始化过程的调用链：

```
main()
  ├── onloadSafe()
  │     └── 设置DOM监听
  │           ├── sentinel.on('nav', injectNavMenu)
  │           └── setInterval(监控DOM变化)
  └── getMenuContainer()
        └── render(<Menu />)
```

## 导出功能调用链

### 文本导出

```
用户点击"Text"按钮
  └── Menu 组件
        └── exportText()
              ├── checkIfConversationStarted()
              ├── getCurrentChatId()
              ├── fetchConversation()
              │     ├── getPageAccessToken()
              │     └── API请求获取数据
              ├── processConversation()
              │     └── 处理会话数据
              ├── conversationToText()
              │     ├── transformAuthor()
              │     └── transformContent()
              ├── getFileNameWithFormat()
              └── downloadFile()
                    └── 创建并下载文件
```

### Markdown导出

```
用户点击"Markdown"按钮
  └── Menu 组件
        └── exportToMarkdown()
              ├── checkIfConversationStarted()
              ├── getCurrentChatId()
              ├── fetchConversation()
              ├── processConversation()
              ├── conversationToMarkdown()
              │     ├── 生成Front Matter
              │     ├── transformAuthor()
              │     ├── transformContent()
              │     └── transformFootNotes()
              ├── getFileNameWithFormat()
              └── downloadFile()
```

### HTML导出

```
用户点击"HTML"按钮
  └── Menu 组件
        └── exportToHtml()
              ├── checkIfConversationStarted()
              ├── getCurrentChatId()
              ├── fetchConversation()
              ├── processConversation()
              ├── conversationToHtml()
              │     ├── 加载HTML模板
              │     ├── transformAuthor()
              │     ├── transformContent()
              │     └── 替换模板变量
              ├── getFileNameWithFormat()
              └── downloadFile()
```

### 图片导出

```
用户点击"PNG"按钮
  └── Menu 组件
        └── exportToImage()
              ├── checkIfConversationStarted()
              ├── getConversationElement()
              │     └── 克隆DOM元素
              ├── html2canvas()
              │     └── 将DOM转换为Canvas
              ├── getFileNameWithFormat()
              └── downloadFile()
                    └── Canvas转换为PNG并下载
```

### JSON导出

```
用户点击"JSON"按钮
  └── Menu 组件
        └── exportToJson()
              ├── checkIfConversationStarted()
              ├── getCurrentChatId()
              ├── fetchConversation()
              ├── getFileNameWithFormat()
              └── downloadFile()
                    └── 直接下载原始JSON
```

## 批量导出调用链

```
用户点击"Export All"按钮
  └── Menu 组件
        └── openExportAllModal()
              └── ExportAllModal 组件
                    ├── useEffect()
                    │     └── fetchAllConversations()
                    │           ├── getConversations()
                    │           └── 处理会话列表
                    └── exportSelectedConversations()
                          ├── showLoadingOverlay()
                          └── 根据选择的格式调用相应的导出函数
                                ├── exportAllToMarkdown()
                                ├── exportAllToHtml()
                                ├── exportAllToJson()
                                └── zipExportJson()
```

## API相关调用链

### 获取会话数据

```
fetchConversation(chatId)
  ├── isSharePage()
  │     └── 检查是否为分享页面
  ├── getConversationFromSharePage()
  │     └── 从页面全局变量获取数据
  ├── getPageAccessToken()
  │     └── 获取API访问令牌
  └── fetch()
        └── API请求获取会话数据
```

### 处理会话数据

```
processConversation(conversation)
  ├── 提取会话结构
  │     └── 构建线性会话结构
  ├── 提取模型信息
  └── 返回处理后的数据结构
```

### 获取会话列表

```
fetchAllConversations()
  ├── getConversations(offset, limit)
  │     ├── getPageAccessToken()
  │     └── fetch()
  └── 处理分页和结果合并
```

## DOM操作相关调用链

### 注入UI组件

```
injectNavMenu(nav)
  ├── getMenuContainer()
  │     └── render(<Menu />)
  └── nav.append(container)
```

### 监听DOM变化

```
sentinel.on('selector', callback)
  └── 当匹配的元素出现时触发回调
```

## 工具函数调用链

### 下载文件

```
downloadFile(fileName, mimeType, content)
  ├── 创建Blob对象
  ├── URL.createObjectURL()
  ├── 创建并点击下载链接
  └── 延时清理URL对象
```

### 文件名格式化

```
getFileNameWithFormat(format, extension, data)
  ├── 替换变量占位符
  └── 添加文件扩展名
```

### 内容转换处理

```
transformContent(content)
  ├── 根据内容类型处理
  │     ├── 文本内容
  │     ├── 代码内容
  │     ├── 图片内容
  │     └── 其他特殊内容
  └── 返回格式化后的内容
```

## 关键依赖关系

以下是项目中主要模块的依赖关系图：

```
main.tsx
  ├── api.ts
  ├── page.ts
  └── ui/Menu.tsx
        ├── exporter/text.ts
        │     └── utils/
        ├── exporter/markdown.ts
        │     └── utils/
        ├── exporter/html.ts
        │     └── utils/
        ├── exporter/image.ts
        │     └── utils/
        └── exporter/json.ts
              └── utils/
```

## 共享模块调用情况

### utils/ 模块

utils 目录下的工具函数被多个模块共享使用：

- **download.ts**: 被所有导出格式模块使用
- **dom.ts**: 主要被图片导出和UI注入使用
- **markdown.ts**: 被Markdown和HTML导出使用
- **storage.ts**: 被设置页面和导出模块使用
- **utils.ts**: 通用工具函数，被多个模块使用

### api.ts 模块

api.ts 提供了与ChatGPT API交互的核心功能，被以下模块使用：

- 各种导出格式模块 (除了image.ts外)
- UI相关组件
- 批量导出功能

### page.ts 模块

page.ts 提供了与页面交互的功能，主要被以下模块使用：

- api.ts (获取访问令牌和检查页面类型)
- 导出格式模块 (检查会话状态)
- UI组件 (决定何时显示UI元素)

## 总结

通过对调用链条的分析，我们可以看到 ChatGPT Exporter 采用了模块化的设计，各个功能模块之间有清晰的职责划分。主要特点：

1. **入口点明确**: main.tsx 作为入口点初始化整个应用
2. **分层设计**: UI层 -> 业务逻辑层 -> API层 -> 工具函数层
3. **功能模块化**: 不同导出格式有独立的实现模块
4. **共享基础设施**: 通用功能抽象为工具函数

这种设计使得代码更易于维护和扩展，也为迁移到其他类似网站提供了良好的基础。 