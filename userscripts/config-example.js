/**
 * 请求记录器配置文件示例
 * 你可以复制此文件并重命名为 config.js 来自定义脚本行为
 * 请注意：需要在 RequestLogger.user.js 中引入此配置
 */

const requestLoggerConfig = {
    /**
     * UI配置
     * @type {Object}
     */
    ui: {
        // 按钮位置 (右下角: 'bottom-right', 右上角: 'top-right', 左下角: 'bottom-left', 左上角: 'top-left')
        buttonPosition: 'bottom-right',
        
        // 按钮颜色 (CSS颜色值)
        buttonColor: '#4CAF50',
        
        // 按钮图标 (emoji或HTML)
        buttonIcon: '📝',
        
        // 面板宽度 (像素)
        panelWidth: 300,
        
        // 日期时间格式 (依赖浏览器 Intl.DateTimeFormat API)
        dateFormat: {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }
    },
    
    /**
     * 请求捕获配置
     * @type {Object}
     */
    capture: {
        // 是否捕获资源请求 (图片、脚本、样式表等)
        captureResources: true,
        
        // 是否捕获WebSocket连接
        captureWebSockets: false,
        
        // 是否捕获请求头
        captureHeaders: true,
        
        // 是否捕获响应体内容
        captureResponseBody: true,
        
        // 响应体内容最大长度 (字符数)
        maxResponseBodySize: 5000,
        
        // 需要过滤掉的请求URL (正则表达式数组)
        excludeUrls: [
            /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i
        ],
        
        // 自动开始捕获 (页面加载后自动开始)
        autoStart: false,
        
        // 自动停止捕获延迟 (毫秒，设为0禁用自动停止)
        autoStopDelay: 0
    },
    
    /**
     * 存储配置
     * @type {Object}
     */
    storage: {
        // 最大保存会话数量 (0表示不限制)
        maxSessions: 10,
        
        // 过期会话清理 (天数，0表示不清理)
        sessionExpiry: 7,
        
        // 导出文件名格式 (支持变量: {date}, {time}, {host})
        exportFilenameFormat: 'requests_{date}_{time}_{host}'
    }
};

// 如果在非油猴环境中使用，则导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = requestLoggerConfig;
} 