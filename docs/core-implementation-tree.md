# ChatGPT Exporter 核心实现树形结构

本文档以树形结构描述 ChatGPT Exporter 的核心实现，包括其源码文件的主要内容和功能关系。

## 项目结构总览

```
ChatGPT Exporter
├── src/                           # 源代码目录
│   ├── main.tsx                   # 主入口文件，负责初始化和DOM注入
│   ├── api.ts                     # API交互相关函数
│   ├── page.ts                    # 页面操作相关函数
│   ├── constants.ts               # 常量定义
│   ├── i18n.ts                    # 国际化实现
│   ├── type.ts                    # 类型定义
│   ├── template.html              # HTML导出模板
│   ├── exporter/                  # 导出功能实现目录
│   │   ├── text.ts                # 文本导出
│   │   ├── markdown.ts            # Markdown导出
│   │   ├── html.ts                # HTML导出
│   │   ├── image.ts               # 图片导出
│   │   └── json.ts                # JSON导出
│   ├── ui/                        # UI组件目录
│   │   ├── Menu.tsx               # 主菜单组件
│   │   ├── SettingContext.tsx     # 设置上下文
│   │   ├── ExportAllModal.tsx     # 批量导出对话框
│   │   └── ...
│   ├── hooks/                     # React Hooks
│   ├── utils/                     # 工具函数目录
│   │   ├── download.ts            # 下载相关
│   │   ├── dom.ts                 # DOM操作
│   │   ├── markdown.ts            # Markdown处理
│   │   ├── storage.ts             # 存储操作
│   │   ├── text.ts                # 文本处理
│   │   └── utils.ts               # 通用工具函数
│   ├── locales/                   # 语言包
│   └── styles/                    # 样式文件
└── dist/                          # 构建输出目录
```

## 核心源码文件详解

### main.tsx - 主入口文件

```
main.tsx
├── import 依赖
├── main() 函数
│   ├── onloadSafe() - 安全加载
│   │   ├── 创建样式元素
│   │   ├── 设置注入映射 (injectionMap)
│   │   ├── injectNavMenu() - 注入导航菜单
│   │   │   ├── 获取菜单容器
│   │   │   └── 将菜单插入到页面中
│   │   ├── sentinel.on() - 设置DOM监听
│   │   ├── setInterval() - 定期检查DOM变化
│   │   ├── 处理共享页面
│   │   └── 插入时间戳
│   └── getMenuContainer() - 创建菜单容器
│       └── render(<Menu />) - 渲染菜单组件
```

### api.ts - API交互函数

```
api.ts
├── 类型定义
│   ├── ApiSession - 会话信息
│   ├── ConversationNodeMessage - 对话消息节点
│   ├── ConversationNode - 对话节点
│   ├── ApiConversation - API对话数据
│   └── ApiConversationWithId - 带ID的API对话数据
├── fetchConversation() - 获取会话数据
│   ├── 处理共享页面
│   ├── 获取访问令牌
│   └── 调用API获取数据
├── getCurrentChatId() - 获取当前会话ID
├── processConversation() - 处理会话数据
│   ├── 提取会话结构
│   ├── 构建线性会话结构
│   └── 提取模型信息
├── getConversations() - 获取会话列表
├── transformContent() - 处理各种内容类型
│   ├── 处理文本内容
│   ├── 处理代码内容
│   ├── 处理图片内容
│   └── 处理其他类型
└── 其他辅助函数
```

### page.ts - 页面操作函数

```
page.ts
├── 全局类型声明 (Window接口扩展)
├── getHistoryDisabled() - 检查历史是否禁用
├── getPageAccessToken() - 获取页面访问令牌
├── getUserProfile() - 获取用户信息
├── getChatIdFromUrl() - 从URL获取会话ID
├── isSharePage() - 检查是否为共享页面
├── getConversationFromSharePage() - 从共享页面获取会话
├── getUserAvatar() - 获取用户头像
└── checkIfConversationStarted() - 检查会话是否开始
```

### exporter/ 目录 - 导出功能实现

#### text.ts - 文本导出

```
text.ts
├── exportToText() - 文本导出入口
│   ├── 检查会话状态
│   ├── 获取会话数据
│   ├── 处理会话数据
│   ├── 转换为文本格式
│   └── 下载文件
├── exportAllToText() - 批量导出文本
│   ├── 遍历会话列表
│   ├── 创建ZIP文件
│   └── 下载ZIP文件
└── conversationToText() - 转换会话为文本
    ├── 遍历会话节点
    ├── 处理作者信息
    ├── 处理内容
    └── 组装文本
```

#### markdown.ts - Markdown导出

```
markdown.ts
├── exportToMarkdown() - Markdown导出入口
│   ├── 检查会话状态
│   ├── 获取会话数据
│   ├── 处理会话数据
│   ├── 转换为Markdown格式
│   └── 下载文件
├── exportAllToMarkdown() - 批量导出Markdown
│   ├── 创建ZIP文件
│   ├── 处理文件名冲突
│   └── 下载ZIP文件
├── conversationToMarkdown() - 转换会话为Markdown
│   ├── 创建Front Matter
│   ├── 处理时间戳
│   ├── 转换作者信息
│   ├── 转换内容
│   │   ├── 处理数学公式
│   │   ├── 处理代码块
│   │   └── 处理其他格式
│   └── 组装Markdown文本
├── transformAuthor() - 转换作者信息
└── transformFootNotes() - 处理脚注
```

#### html.ts - HTML导出

```
html.ts
├── exportToHtml() - HTML导出入口
│   ├── 检查会话状态
│   ├── 获取会话数据
│   ├── 处理会话数据
│   ├── 转换为HTML格式
│   └── 下载文件
├── exportAllToHtml() - 批量导出HTML
│   ├── 创建ZIP文件
│   ├── 处理文件名冲突
│   └── 下载ZIP文件
├── conversationToHtml() - 转换会话为HTML
│   ├── 读取HTML模板
│   ├── 处理会话标题
│   ├── 处理会话内容
│   │   ├── 转换作者信息
│   │   ├── 处理时间戳
│   │   └── 转换消息内容
│   └── 替换模板变量
├── getHtmlTemplate() - 获取HTML模板
└── 其他辅助函数
```

#### image.ts - 图片导出

```
image.ts
├── exportToImage() - 图片导出入口
│   ├── 检查会话状态
│   ├── 获取会话元素
│   │   ├── 查找对话元素
│   │   ├── 克隆DOM元素
│   │   └── 处理样式
│   ├── 使用html2canvas转换为Canvas
│   └── 下载PNG图片
└── 辅助函数
```

#### json.ts - JSON导出

```
json.ts
├── exportToJson() - JSON导出入口
│   ├── 检查会话状态
│   ├── 获取会话数据
│   └── 下载原始JSON
├── exportAllToJson() - 批量导出JSON
│   ├── 创建ZIP文件
│   ├── 处理文件名冲突
│   └── 下载ZIP文件
└── zipExportJson() - 压缩导出JSON
```

### ui/ 目录 - UI组件

```
ui/
├── Menu.tsx - 主菜单组件
│   ├── Menu 组件
│   │   ├── 渲染导出按钮
│   │   ├── 处理导出操作
│   │   │   ├── 调用各种导出函数
│   │   │   └── 处理错误
│   │   ├── 打开设置
│   │   └── 打开批量导出对话框
│   └── ExportButton 组件
├── SettingContext.tsx - 设置上下文
│   ├── SettingProvider 组件
│   ├── useSetting Hook
│   └── 设置状态管理
├── ExportAllModal.tsx - 批量导出对话框
│   ├── 会话列表获取
│   ├── 会话选择
│   ├── 导出格式选择
│   ├── 批量导出处理
│   └── 删除/归档功能
└── 其他UI组件
```

### utils/ 目录 - 工具函数

```
utils/
├── download.ts - 下载相关
│   ├── downloadFile() - 下载文件
│   ├── getFileNameWithFormat() - 文件名格式化
│   └── 其他下载辅助函数
├── dom.ts - DOM操作
│   ├── getBase64FromImageUrl() - 图片转Base64
│   ├── getBase64FromImg() - 图片元素转Base64
│   └── 其他DOM操作函数
├── markdown.ts - Markdown处理
│   ├── fromMarkdown() - 解析Markdown
│   ├── toMarkdown() - 生成Markdown
│   └── Markdown转换辅助函数
├── storage.ts - 存储操作
│   ├── ScriptStorage 类
│   │   ├── get() - 获取存储数据
│   │   ├── set() - 设置存储数据
│   │   └── remove() - 删除存储数据
│   └── 存储相关辅助函数
├── text.ts - 文本处理
│   ├── standardizeLineBreaks() - 标准化换行符
│   └── 其他文本处理函数
└── utils.ts - 通用工具函数
    ├── dateStr() - 日期字符串
    ├── timestamp() - 时间戳
    ├── onloadSafe() - 安全加载
    └── 其他通用函数
```

## 核心功能流程

```
用户交互
├── 点击导出按钮
│   ├── 单个会话导出
│   │   ├── 文本导出
│   │   │   └── exportToText()
│   │   ├── Markdown导出
│   │   │   └── exportToMarkdown()
│   │   ├── HTML导出
│   │   │   └── exportToHtml()
│   │   ├── 图片导出
│   │   │   └── exportToImage()
│   │   └── JSON导出
│   │       └── exportToJson()
│   └── 批量导出
│       ├── 打开批量导出对话框
│       │   └── openExportAllModal()
│       └── 选择并导出
│           ├── 批量Markdown导出
│           │   └── exportAllToMarkdown()
│           ├── 批量HTML导出
│           │   └── exportAllToHtml()
│           └── 批量JSON导出
│               └── exportAllToJson()
└── 数据处理流程
    ├── 获取数据
    │   └── fetchConversation()
    ├── 处理数据
    │   └── processConversation()
    ├── 格式转换
    │   ├── conversationToText()
    │   ├── conversationToMarkdown()
    │   ├── conversationToHtml()
    │   └── 其他格式
    └── 下载文件
        └── downloadFile()
```

## 关键交互点

```
ChatGPT页面 <-> ChatGPT Exporter
├── DOM注入
│   └── sentinel.on() 检测并注入UI
├── 数据获取
│   ├── 从URL获取会话ID
│   │   └── getChatIdFromUrl()
│   ├── 获取访问令牌
│   │   └── getPageAccessToken()
│   └── API调用获取数据
│       └── fetch()
└── 导出操作
    ├── 创建文件
    │   └── Blob对象
    └── 触发下载
        └── 创建并点击下载链接
```

这种树形结构展示了ChatGPT Exporter项目的核心实现，清晰地描述了各个源文件之间的关系以及主要功能的组织方式。通过这种方式，可以更容易地理解项目的整体架构和扩展点，为迁移到其他类似网站提供参考。 