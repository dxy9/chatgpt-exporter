# ChatGPT API 使用详解

本文档详细记录 ChatGPT Exporter 使用的 ChatGPT API，包括各个端点的功能、请求/响应格式以及使用场景，便于开发者理解并迁移到其他类似网站。

## API 概览

ChatGPT Exporter 主要使用了以下 ChatGPT API 端点：

```
ChatGPT API 端点
├── 会话操作
│   ├── /backend-api/conversation/{id} - 获取会话详情
│   ├── /backend-api/conversations - 获取会话列表
│   └── /backend-api/conversation/{id}/archive - 归档会话
├── 共享功能
│   └── /backend-api/share/create - 创建共享链接
└── 用户操作
    └── /backend-api/user/account - 获取用户账户信息
```

## API 详解

### 1. 获取会话详情

此 API 是 ChatGPT Exporter 的核心，用于获取单个会话的完整内容。

**请求格式**：

```
GET https://chat.openai.com/backend-api/conversation/{conversationId}
请求头:
  Authorization: Bearer {accessToken}
```

**响应格式**：

```javascript
{
  "id": "conversation_id",
  "title": "会话标题",
  "create_time": 1678015311.655875, // Unix时间戳
  "update_time": 1678185638.890551,
  "mapping": {
    "message_id1": {
      "id": "message_id1",
      "message": {
        "id": "message_id1",
        "author": {
          "role": "system|user|assistant|tool",
          "metadata": {}
        },
        "create_time": 1678015311.655875,
        "content": {
          "content_type": "text",
          "parts": ["消息内容"]
        },
        "end_turn": true,
        "weight": 1,
        "metadata": {
          "model_slug": "text-davinci-002-render-sha", // 模型信息
          "timestamp_": "absolute"
        },
        "recipient": "all"
      },
      "parent": "parent_message_id",
      "children": ["child_message_id"]
    },
    // 更多消息节点...
  },
  "moderation_results": [],
  "current_node": "最新消息ID"
}
```

**使用方式**：

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

### 2. 获取会话列表

用于批量导出功能，获取用户的所有会话。

**请求格式**：

```
GET https://chat.openai.com/backend-api/conversations?offset=0&limit=20
请求头:
  Authorization: Bearer {accessToken}
```

**响应格式**：

```javascript
{
  "items": [
    {
      "id": "conversation_id1",
      "title": "会话标题1",
      "create_time": 1678015311.655875,
      "update_time": 1678185638.890551,
      "mapping": {/* 简化的消息映射 */},
      "current_node": "最新消息ID",
      // 其他元数据...
    },
    // 更多会话...
  ],
  "total": 152,          // 会话总数
  "limit": 20,           // 当前页条数
  "offset": 0,           // 偏移量
  "has_missing_items": false
}
```

**使用方式**：

```typescript
// api.ts
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

// 获取所有会话
export async function fetchAllConversations() {
    const result = await getConversations(0, 100)
    const { items, total } = result
    
    // 如果会话数超过100，继续请求剩余的会话
    if (total > 100) {
        const remainingRequests = []
        for (let offset = 100; offset < total; offset += 100) {
            remainingRequests.push(getConversations(offset, 100))
        }
        const remainingResults = await Promise.all(remainingRequests)
        remainingResults.forEach(r => items.push(...r.items))
    }
    
    return items
}
```

### 3. 归档会话

用于批量管理功能，将选定的会话归档。

**请求格式**：

```
POST https://chat.openai.com/backend-api/conversation/{conversationId}/archive
请求头:
  Authorization: Bearer {accessToken}
请求体:
  {}  // 空对象
```

**使用方式**：

```typescript
// api.ts
export async function archiveConversation(conversationId: string) {
    const accessToken = getPageAccessToken()
    if (!accessToken) throw new Error('Failed to get access token')
    
    await fetch(`${apiUrl}/conversation/${conversationId}/archive`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
    })
}
```

### 4. 获取用户信息

获取当前登录用户的信息，用于在导出文件中包含用户数据。

**请求格式**：

```
GET https://chat.openai.com/backend-api/user/account
请求头:
  Authorization: Bearer {accessToken}
```

**响应格式**：

```javascript
{
  "id": "user_id",
  "name": "用户名",
  "email": "user@example.com",
  "image": "头像URL",
  "picture": "头像URL",
  "groups": [],
  // 其他用户信息...
}
```

## 数据转换

从API获取的原始数据需要经过处理才能用于导出。`processConversation`函数负责将API返回的树状会话结构转换为线性会话：

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
    
    // 提取模型信息
    let model = ''
    let modelSlug = ''
    for (const item of conversationNodes) {
        if (item.message?.author.role === 'assistant' && item.message.metadata?.model_slug) {
            modelSlug = item.message.metadata.model_slug
            model = getModelName(modelSlug)
            break
        }
    }
    
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

## 共享页面数据获取

对于共享页面，数据不是通过API请求获取，而是直接从页面全局变量中获取：

```typescript
// page.ts
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

## 认证和访问令牌

所有API请求都需要一个访问令牌，该令牌从页面中提取：

```typescript
// page.ts
export function getPageAccessToken(): string | null {
    return unsafeWindow?.__remixContext?.state?.loaderData?.root?.clientBootstrap?.session?.accessToken ?? null
}
```

## 特殊内容处理

ChatGPT 支持多种内容类型，需要特殊处理：

### 1. 多模态内容（图片）

```typescript
// api.ts
function handleImageContent(part: MultiModalInputImage) {
    if (part.asset_pointer.startsWith('file-service://')) {
        return `![Image](${part.asset_pointer.replace('file-service://', '')})`
    }
    return `![Image](${part.asset_pointer})`
}
```

### 2. 代码块

```typescript
// api.ts
function handleCodeContent(content: { language: string, text: string }) {
    return `\`\`\`${content.language}\n${content.text}\n\`\`\``
}
```

## 迁移注意事项

在将ChatGPT Exporter迁移到其他类似网站时，需要关注以下API相关的改动点：

1. **API端点URL**: 不同网站的API端点会不同
2. **认证机制**: 访问令牌的获取方式可能不同
3. **会话数据结构**: 消息格式和树状结构可能有差异
4. **特殊内容处理**: 如图片、代码块的处理方式可能需要调整

可以通过创建特定于网站的适配器类来处理这些差异，使核心导出逻辑保持不变。 