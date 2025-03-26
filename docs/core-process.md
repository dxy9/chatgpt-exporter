# 核心流程

本文档详细描述 ChatGPT Exporter 的核心工作流程，从页面加载到导出完成的完整过程。这有助于理解整个项目的运行机制，并为迁移到其他网站提供思路。

## 总体流程图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  页面加载   │ -> │  脚本初始化 │ -> │ UI注入页面  │ -> │ 用户交互    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
                                                               ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 文件下载    │ <- │ 格式转换    │ <- │ 数据处理    │ <- │ 数据获取    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 详细流程

### 1. 页面加载与脚本初始化

当用户访问 ChatGPT 网站时，浏览器脚本管理器（如 Tampermonkey）会自动加载并执行 ChatGPT Exporter 脚本。

初始化过程：
1. 加载依赖库（如Preact、sentinel-js）
2. 设置国际化
3. 准备DOM监听

```typescript
// main.tsx
function main() {
    onloadSafe(() => {
        const styleEl = document.createElement('style')
        styleEl.id = 'sentinel-css'
        document.head.append(styleEl)
        
        // 设置DOM监听
        // ...
    })
}
```

### 2. UI注入

脚本使用 sentinel-js 库监听 DOM 变化，当检测到合适的注入点时，将导出按钮注入到页面中。

注入流程：
1. 监听导航菜单元素
2. 创建导出按钮容器
3. 将按钮添加到页面

```typescript
// main.tsx
sentinel.on('nav', injectNavMenu)

function injectNavMenu(nav: HTMLElement) {
    if (injectionMap.has(nav)) return

    const container = getMenuContainer()
    injectionMap.set(nav, container)

    const chatList = nav.querySelector(':scope > div.overflow-y-auto')
    if (chatList) {
        chatList.after(container)
    }
    else {
        nav.append(container)
    }
}
```

### 3. 用户交互

用户点击导出按钮时，脚本显示导出选项菜单，让用户选择导出格式和其他选项。

交互流程：
1. 展示导出格式选项
2. 处理用户选择
3. 调用对应的导出函数

### 4. 数据获取

根据用户选择的导出选项，脚本会获取会话数据。数据获取有两种方式：

#### API数据获取

通过 ChatGPT API 获取完整会话数据，这种方式可以获取更丰富的元数据。

```typescript
// api.ts
export async function fetchConversation(conversationId: string, withFullHistory = false) {
    // 处理从分享页面获取数据的特殊情况
    if (isSharePage()) {
        const data = getConversationFromSharePage()
        if (data) return data
    }

    // 从API获取数据
    const accessToken = getPageAccessToken()
    if (!accessToken) {
        throw new Error('Failed to get access token')
    }

    const result = await fetch(`${apiUrl}/conversation/${conversationId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })
    
    return await result.json()
}
```

#### DOM数据获取

对于图片导出等功能，需要直接从页面DOM中获取渲染好的会话内容。

```typescript
// exporter/image.ts
function getConversationElement() {
    const threads = document.querySelectorAll('main [data-testid^="conversation-turn-"]')
    if (threads.length === 0) {
        throw new Error('No conversation found')
    }
    
    // 创建克隆元素用于截图
    const element = document.createElement('div')
    element.className = 'chat-exporter-clone'
    
    // 克隆会话元素
    threads.forEach((thread) => {
        const clone = thread.cloneNode(true) as HTMLElement
        // 处理克隆元素...
        element.appendChild(clone)
    })
    
    return element
}
```

### 5. 数据处理

获取原始数据后，需要对数据进行处理，转换为更易于操作的格式。

```typescript
// api.ts
export function processConversation(conversation: ApiConversationWithId): ConversationResult {
    const mappings = conversation.mapping
    const currentNode = mappings[conversation.current_node]
    
    // 创建对话节点数组
    const conversationNodes: ConversationNode[] = []
    let node = currentNode
    
    // 遍历对话树，构建线性会话结构
    while (node) {
        conversationNodes.unshift(node)
        const parentId = node.parent
        node = parentId ? mappings[parentId] : null
    }
    
    // 处理额外信息
    // ...
    
    return {
        id: conversation.id,
        title: conversation.title,
        model,
        modelSlug,
        createTime: conversation.create_time,
        updateTime: conversation.update_time,
        conversationNodes,
    }
}
```

### 6. 格式转换

根据用户选择的格式，将处理好的数据转换为对应的格式。

#### 文本格式

```typescript
// exporter/text.ts
function conversationToText(conversation: ConversationResult) {
    const { conversationNodes } = conversation
    
    return conversationNodes.map(({ message }) => {
        if (!message || !message.content) return null
        
        // 跳过不需要的消息
        if (message.recipient !== 'all') return null
        
        const author = transformAuthor(message.author)
        const content = transformContent(message.content)
        
        return `${author}:\n${content}`
    }).filter(Boolean).join('\n\n')
}
```

#### Markdown格式

```typescript
// exporter/markdown.ts
function conversationToMarkdown(conversation: ConversationResult, metaList?: ExportMeta[]) {
    const { id, title, model, createTime, conversationNodes } = conversation
    const source = `${baseUrl}/c/${id}`
    
    // 处理元数据
    const frontMatter = createFrontMatter(title, source, model, createTime, metaList)
    
    // 处理会话内容
    const content = conversationNodes.map(({ message }) => {
        // 转换消息内容...
        return `#### ${author}:\n${timestampHtml}${content}`
    }).filter(Boolean).join('\n\n')
    
    return `${frontMatter}# ${title}\n\n${content}`
}
```

### 7. 文件下载

格式转换完成后，调用下载函数将结果保存为文件。

```typescript
// utils/download.ts
export function downloadFile(fileName: string, mimeType: string, content: string | Blob) {
    const blob = typeof content === 'string'
        ? new Blob([content], { type: mimeType })
        : content
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    
    setTimeout(() => {
        URL.revokeObjectURL(url)
    }, 60000)
}
```

## 批量导出流程

批量导出与单个会话导出类似，但包含以下额外步骤：

1. 获取用户的所有会话列表
2. 用户选择要导出的会话
3. 批量获取每个会话的内容
4. 格式转换处理
5. 创建ZIP文件打包下载

```typescript
// 获取会话列表
export async function getConversations(offset = 0, limit = 20) {
    const accessToken = getPageAccessToken()
    if (!accessToken) throw new Error('Failed to get access token')
    
    const result = await fetch(`${apiUrl}/conversations?offset=${offset}&limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })
    
    return await result.json()
}

// 批量导出为ZIP文件
export async function exportAllToZip(conversations: ApiConversationWithId[], format: string) {
    const zip = new JSZip()
    const filenameMap = new Map<string, number>()
    
    // 处理每个会话
    for (const conversation of conversations) {
        const processed = processConversation(conversation)
        let content = ''
        
        // 根据格式生成内容
        switch (format) {
            case 'markdown':
                content = conversationToMarkdown(processed)
                break
            case 'html':
                content = conversationToHtml(processed)
                break
            // 其他格式...
        }
        
        // 添加到ZIP文件
        const fileName = getUniqueFileName(filenameMap, processed.title, format)
        zip.file(fileName, content)
    }
    
    // 生成并下载ZIP文件
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadFile('chatgpt-export.zip', 'application/zip', blob)
}
```

## 特殊情况处理

### 共享页面处理

对于ChatGPT的共享页面（以`/share/`开头的URL），脚本采用不同的数据获取方式。

```typescript
// page.ts
export function isSharePage() {
    return location.pathname.startsWith('/share')
        && !location.pathname.endsWith('/continue')
}

export function getConversationFromSharePage() {
    if (window.__NEXT_DATA__?.props?.pageProps?.serverResponse?.data) {
        return JSON.parse(JSON.stringify(
            window.__NEXT_DATA__.props.pageProps.serverResponse.data
        ))
    }
    // 其他获取方式...
    return null
}
```

### 多模态内容处理

处理图片、代码等非文本内容。

```typescript
// 处理图片内容
function handleImageContent(part: MultiModalInputImage) {
    if (part.asset_pointer.startsWith('file-service://')) {
        return `![Image](${part.asset_pointer.replace('file-service://', '')})`
    }
    return `![Image](${part.asset_pointer})`
}

// 处理代码内容
function handleCodeContent(content: { language: string, text: string }) {
    return `\`\`\`${content.language}\n${content.text}\n\`\`\``
}
```

## 错误处理

脚本实现了错误处理机制，确保在获取数据失败时给用户提供有用的反馈。

```typescript
try {
    const data = await fetchConversation(chatId)
    // 处理数据...
} 
catch (error) {
    console.error('Failed to fetch conversation:', error)
    alert(`导出失败: ${error.message}`)
}
``` 