# 迁移指南

本文档提供将 ChatGPT Exporter 迁移到其他类似对话类网站的指导方案。通过理解核心组件和适当的修改，可以将导出功能应用于其他平台。

## 迁移概述

将 ChatGPT Exporter 迁移到其他网站主要涉及以下几个方面：

1. **页面注入机制** - 调整 DOM 选择器以适应目标网站
2. **数据获取方式** - 修改 API 调用和数据提取逻辑
3. **数据结构转换** - 将目标网站的数据结构转换为通用格式
4. **UI 调整** - 适应目标网站的样式和布局

## 迁移步骤

### 1. 页面分析

首先需要对目标网站进行分析，了解其页面结构和数据流：

```typescript
// 分析步骤
// 1. 使用浏览器开发者工具检查页面结构
// 2. 确定对话内容在DOM中的位置
// 3. 探索目标网站的API请求和响应格式
// 4. 了解认证机制和数据获取方式
```

### 2. 修改页面注入逻辑

根据目标网站的页面结构，修改 `main.tsx` 中的 DOM 选择器和注入逻辑：

```typescript
// 示例：修改 sentinel 选择器以适应新网站
sentinel.on('新网站的导航选择器', injectNavMenu)

// 修改注入位置的查找方式
function injectNavMenu(nav: HTMLElement) {
    if (injectionMap.has(nav)) return

    const container = getMenuContainer()
    injectionMap.set(nav, container)

    // 根据新网站结构修改注入位置
    const targetElement = nav.querySelector('新网站的目标元素选择器')
    if (targetElement) {
        targetElement.after(container)
    }
    else {
        nav.append(container)
    }
}
```

### 3. 调整数据获取逻辑

修改 `api.ts` 和 `page.ts` 以适应新网站的 API 结构和认证方式：

```typescript
// 示例：修改会话 ID 的获取方式
export function getChatIdFromUrl() {
    // 根据新网站的 URL 格式获取会话 ID
    const match = location.pathname.match(/新网站的URL正则表达式/)
    if (match) return match[1]
    return null
}

// 修改数据获取方式
export async function fetchConversation(conversationId: string) {
    // 新网站的认证方式
    const accessToken = 获取新网站的访问令牌()
    
    // 新网站的 API 端点
    const result = await fetch(`新网站的API地址/${conversationId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            // 其他必要的头信息
        },
    })
    
    return await result.json()
}
```

### 4. 修改数据处理逻辑

根据新网站的数据结构，调整数据处理函数：

```typescript
// 示例：调整会话数据处理逻辑
export function processConversation(conversation: 新网站的会话类型): ConversationResult {
    // 将新网站的数据结构转换为通用格式
    const conversationNodes = []
    
    // 根据新网站数据结构提取对话节点
    // ...
    
    return {
        id: conversation.id 或等效字段,
        title: conversation.title 或等效字段,
        model: 提取模型信息,
        createTime: 提取创建时间,
        updateTime: 提取更新时间,
        conversationNodes,
    }
}
```

### 5. 调整内容转换函数

针对新网站中可能的特殊内容类型（如特殊格式的代码块、图片等），修改内容转换函数：

```typescript
// 示例：调整内容转换逻辑
function transformContent(content: 新网站的内容类型) {
    // 根据内容类型进行不同处理
    switch (content.type) {
        case '新网站的文本类型':
            return 处理文本内容
        case '新网站的代码类型':
            return 处理代码内容
        case '新网站的图片类型':
            return 处理图片内容
        // 其他特殊类型
        default:
            return 默认处理
    }
}
```

### 6. 适配 UI 样式

调整 UI 组件和样式以适应新网站的设计风格：

```typescript
// 示例：调整按钮样式
// 在 ui/Menu.tsx 中
function ExportButton({ children, onClick }: { children: ReactNode, onClick: () => void }) {
    return (
        <button
            className="新网站的按钮样式类"
            onClick={onClick}
        >
            {children}
        </button>
    )
}
```

## 常见迁移挑战

### 1. 认证机制差异

不同网站的认证机制可能有很大差异，需要找到获取访问令牌的合适方法：

```typescript
// 可能的解决方案
// 1. 从 localStorage/sessionStorage 中获取令牌
export function getPageAccessToken() {
    return localStorage.getItem('新网站的令牌键名')
}

// 2. 从 Cookie 中获取
export function getPageAccessToken() {
    const match = document.cookie.match(/令牌Cookie正则表达式/)
    return match ? match[1] : null
}

// 3. 从全局变量中获取
export function getPageAccessToken() {
    return window.某全局对象?.token
}
```

### 2. 数据结构差异

不同网站的会话数据结构可能有很大不同，需要适当转换：

```typescript
// 定义新的类型描述目标网站的数据结构
interface NewSiteConversation {
    // 新网站的数据结构字段
}

// 转换函数
function convertToCommonFormat(newSiteData: NewSiteConversation): ConversationResult {
    // 转换逻辑
    // ...
}
```

### 3. DOM 结构变化检测

网站可能会经常更新其 DOM 结构，需要实现健壮的选择器：

```typescript
// 使用多种选择器增强鲁棒性
function findConversationElement() {
    // 尝试多种选择器
    const element = document.querySelector('主选择器')
        || document.querySelector('备选选择器1')
        || document.querySelector('备选选择器2')
    
    if (!element) {
        throw new Error('无法找到对话元素')
    }
    
    return element
}
```

## 特定网站迁移示例

以下是迁移到几种常见对话类网站的具体建议：

### 迁移到 Claude

Claude 的对话界面与 ChatGPT 有一定相似性，但 API 结构不同：

```typescript
// 获取会话 ID
export function getChatIdFromUrl() {
    const match = location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/)
    return match ? match[1] : null
}

// Claude 特定的数据获取
export async function fetchClaudeConversation(chatId: string) {
    // Claude 特定的 API 调用
    // ...
}
```

### 迁移到 Bard/Gemini

Google 的 Bard/Gemini 具有不同的页面结构和数据管理方式：

```typescript
// Bard 特定的 DOM 结构
sentinel.on('.bard-conversation-container', injectMenu)

// Bard 的数据提取
function extractBardConversation() {
    // 从 Bard 页面提取对话内容
    // ...
}
```

## 通用化建议

为使代码更容易迁移，可以考虑进一步的重构：

1. **创建适配器层**：为不同网站创建特定的适配器，隔离网站特定的逻辑

```typescript
// 适配器接口
interface SiteAdapter {
    getChatId(): string | null
    fetchConversation(chatId: string): Promise<any>
    processConversation(data: any): ConversationResult
    getInjectionPoint(): HTMLElement | null
}

// ChatGPT 适配器
class ChatGPTAdapter implements SiteAdapter {
    // 实现各方法
}

// 新网站适配器
class NewSiteAdapter implements SiteAdapter {
    // 实现各方法
}

// 工厂函数
function createAdapter(): SiteAdapter {
    if (location.hostname.includes('chat.openai.com')) {
        return new ChatGPTAdapter()
    }
    else if (location.hostname.includes('新网站域名')) {
        return new NewSiteAdapter()
    }
    // ...
}
```

2. **使用配置文件**：将网站特定的选择器和 API 路径等信息放入配置文件

```typescript
const siteConfigs = {
    'chat.openai.com': {
        navSelector: 'nav',
        chatIdRegex: /\/c\/([a-zA-Z0-9-]+)/,
        apiEndpoint: 'https://chat.openai.com/backend-api/conversation',
        // ...
    },
    '新网站域名': {
        navSelector: '新网站的导航选择器',
        chatIdRegex: /新网站的URL正则表达式/,
        apiEndpoint: '新网站的API地址',
        // ...
    },
}

const currentConfig = siteConfigs[location.hostname]
```

## 结论

迁移 ChatGPT Exporter 到其他网站需要理解目标网站的页面结构、API 和数据格式，然后有针对性地修改代码。通过合理的适配器设计和配置化管理，可以使迁移过程更为简化，甚至可以支持在多个网站上同时使用。

关键是保持代码的模块化结构，将网站特定的逻辑与通用导出功能分离，这样在迁移时只需要替换与特定网站交互的部分，而保留大部分导出逻辑不变。 