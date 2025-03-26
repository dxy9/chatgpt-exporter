// 主入口文件 - 负责初始化应用和核心功能
import { render } from 'preact'
import sentinel from 'sentinel-js'  // DOM变化监听库
import { fetchConversation, processConversation } from './api'  // 对话相关API
import { getChatIdFromUrl, isSharePage } from './page'  // 页面相关工具
import { Menu } from './ui/Menu'  // 主菜单组件
import { onloadSafe } from './utils/utils'  // 安全加载工具

import './i18n'  // 国际化配置
import './styles/missing-tailwind.css'  // 补充样式

// 启动主函数
main()

/**
 * 主函数 - 初始化应用核心功能
 * 1. 注入菜单到ChatGPT界面
 * 2. 添加消息时间戳功能
 */
function main() {
    // 安全加载确保DOM就绪
    onloadSafe(() => {
        // 创建并注入样式元素
        const styleEl = document.createElement('style')
        styleEl.id = 'sentinel-css'
        document.head.append(styleEl)

        // 维护菜单容器映射，避免重复注入
        const injectionMap = new Map<HTMLElement, HTMLElement>()

        /**
         * 注入导航菜单到指定nav元素
         * @param nav 目标导航栏DOM元素
         */
        const injectNavMenu = (nav: HTMLElement) => {
            if (injectionMap.has(nav)) return  // 避免重复注入

            const container = getMenuContainer()
            injectionMap.set(nav, container)

            // 尝试找到聊天列表区域插入菜单
            const chatList = nav.querySelector(':scope > div.overflow-y-auto, :scope > div.overflow-y-hidden')
            if (chatList) {
                chatList.after(container)  // 插入到聊天列表后面
            }
            else {
                // 回退方案：直接添加到导航底部
                nav.append(container)
            }
        }

        // 监听nav元素出现并注入菜单
        sentinel.on('nav', injectNavMenu)

        // 定时清理无效容器并检查新导航栏
        setInterval(() => {
            // 清理已移除的导航栏对应的菜单容器
            injectionMap.forEach((container, nav) => {
                if (!nav.isConnected) {
                    container.remove()
                    injectionMap.delete(nav)
                }
            })

            // 查找并处理新出现的导航栏
            const navList = Array.from(document.querySelectorAll('nav')).filter(nav => !injectionMap.has(nav))
            navList.forEach(injectNavMenu)
        }, 300)  // 每300ms检查一次

        // 共享页面特殊处理
        if (isSharePage()) {
            sentinel.on(`div[role="presentation"] > .w-full > div >.flex.w-full`, (target) => {
                target.prepend(getMenuContainer())  // 在共享页面顶部添加菜单
            })
        }

        /** 
         * 为每条消息添加时间戳
         * 监听对话区域变化，获取对话ID并添加时间戳
         */
        let chatId = ''  // 当前对话ID缓存
        sentinel.on('[role="presentation"]', async () => {
            const currentChatId = getChatIdFromUrl()  // 从URL获取对话ID
            if (!currentChatId || currentChatId === chatId) return  // 无变化则跳过
            chatId = currentChatId  // 更新缓存ID

            // 获取并处理对话数据
            const rawConversation = await fetchConversation(chatId, false)
            const { conversationNodes } = processConversation(rawConversation)

            // 获取所有消息元素
            const threadContents = Array.from(document.querySelectorAll('main [data-testid^="conversation-turn-"] [data-message-id]'))
            if (threadContents.length === 0) return

            // 为每条消息添加时间戳
            threadContents.forEach((thread, index) => {
                const createTime = conversationNodes[index]?.message?.create_time
                if (!createTime) return  // 无时间信息则跳过

                const date = new Date(createTime * 1000)  // 转换时间戳

                // 创建时间戳DOM元素
                const timestamp = document.createElement('time')
                timestamp.className = 'w-full text-gray-500 dark:text-gray-400 text-sm text-right'
                timestamp.dateTime = date.toISOString()
                timestamp.title = date.toLocaleString()

                // 添加12小时制时间显示
                const hour12 = document.createElement('span')
                hour12.setAttribute('data-time-format', '12')
                hour12.textContent = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                
                // 添加24小时制时间显示
                const hour24 = document.createElement('span')
                hour24.setAttribute('data-time-format', '24')
                hour24.textContent = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                
                timestamp.append(hour12, hour24)
                thread.append(timestamp)  // 添加到消息元素
            })
        })
    })
}

/**
 * 创建菜单容器并渲染Menu组件
 * @returns 包含菜单的DOM容器
 */
function getMenuContainer() {
    const container = document.createElement('div')
    // 设置z-index确保菜单显示在列表上方
    container.style.zIndex = '20'
    // 渲染Menu组件到容器
    render(<Menu container={container} />, container)
    return container
}
