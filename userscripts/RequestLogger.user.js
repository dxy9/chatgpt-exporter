// ==UserScript==
// @name         请求记录器
// @name:en      Request Logger
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  记录浏览器刷新时的所有网络请求
// @description:en  Log all network requests when refreshing the browser
// @author       YuanBao
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_download
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 请求记录存储类
     * @class RequestStore
     */
    class RequestStore {
        constructor() {
            this.requests = [];
            this.isCapturing = false;
            this.pageUrl = window.location.href;
            this.sessionId = new Date().toISOString();
        }

        /**
         * 开始捕获请求
         * @returns {void}
         */
        startCapturing() {
            this.isCapturing = true;
            this.requests = [];
            this.pageUrl = window.location.href;
            this.sessionId = new Date().toISOString();
            console.log('开始捕获请求');
        }

        /**
         * 停止捕获请求
         * @returns {void}
         */
        stopCapturing() {
            this.isCapturing = false;
            console.log(`捕获已停止，共记录 ${this.requests.length} 个请求`);
            this.saveToStorage();
        }

        /**
         * 添加请求到记录
         * @param {Object} request - 请求对象
         * @returns {void}
         */
        addRequest(request) {
            if (this.isCapturing) {
                this.requests.push(request);
            }
        }

        /**
         * 保存请求记录到存储
         * @returns {void}
         */
        saveToStorage() {
            const key = `requests_${this.sessionId}`;
            const data = {
                timestamp: new Date().toISOString(),
                url: this.pageUrl,
                requests: this.requests
            };
            GM_setValue(key, JSON.stringify(data));
        }

        /**
         * 获取所有保存的会话
         * @returns {Array} 会话列表
         */
        getSessions() {
            const keys = GM_listValues();
            return keys
                .filter(key => key.startsWith('requests_'))
                .map(key => {
                    const data = JSON.parse(GM_getValue(key));
                    return {
                        id: key.replace('requests_', ''),
                        timestamp: data.timestamp,
                        url: data.url,
                        requestCount: data.requests.length
                    };
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        /**
         * 获取指定会话的请求
         * @param {string} sessionId - 会话ID
         * @returns {Object|null} 会话数据
         */
        getSession(sessionId) {
            const key = `requests_${sessionId}`;
            const value = GM_getValue(key);
            return value ? JSON.parse(value) : null;
        }

        /**
         * 删除指定会话
         * @param {string} sessionId - 会话ID
         * @returns {void}
         */
        deleteSession(sessionId) {
            const key = `requests_${sessionId}`;
            GM_deleteValue(key);
        }

        /**
         * 导出会话为JSON
         * @param {string} sessionId - 会话ID
         * @returns {void}
         */
        exportSession(sessionId) {
            const session = this.getSession(sessionId);
            if (session) {
                const blob = new Blob([JSON.stringify(session, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const filename = `requests_${sessionId.replace(/:/g, '-')}.json`;
                GM_download(url, filename);
            }
        }
    }

    // 创建请求存储
    const store = new RequestStore();

    // 使用Performance Observer API监听资源加载
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
                store.addRequest({
                    url: entry.name,
                    initiatorType: entry.initiatorType,
                    startTime: entry.startTime,
                    duration: entry.duration,
                    transferSize: entry.transferSize,
                    size: entry.decodedBodySize,
                    timestamp: new Date().toISOString()
                });
            }
        }
    });

    // 监听资源请求
    observer.observe({ entryTypes: ['resource'] });

    // 使用Fetch API和XMLHttpRequest的猴子补丁来捕获请求
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0] instanceof Request ? args[0].url : String(args[0]);
        const startTime = performance.now();
        const fetchPromise = originalFetch.apply(this, args);
        
        fetchPromise.then(response => {
            const endTime = performance.now();
            const clonedResponse = response.clone();
            
            clonedResponse.text().then(body => {
                store.addRequest({
                    url: url,
                    method: args[0] instanceof Request ? args[0].method : 'GET',
                    type: 'fetch',
                    status: response.status,
                    statusText: response.statusText,
                    headers: Array.from(response.headers.entries()),
                    body: body.substring(0, 5000), // 限制body大小
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString()
                });
            }).catch(error => {
                console.error('Error reading response body:', error);
            });
        }).catch(error => {
            console.error('Fetch error:', error);
        });
        
        return fetchPromise;
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        this._requestMethod = method;
        this._requestUrl = url;
        this._requestHeaders = {};
        this._startTime = performance.now();
        return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
        const xhr = this;
        
        xhr.addEventListener('load', function() {
            const endTime = performance.now();
            
            store.addRequest({
                url: xhr._requestUrl,
                method: xhr._requestMethod,
                type: 'xhr',
                status: xhr.status,
                statusText: xhr.statusText,
                responseType: xhr.responseType,
                responseText: xhr.responseText ? xhr.responseText.substring(0, 5000) : '', // 限制大小
                duration: endTime - xhr._startTime,
                requestBody: body ? body.toString().substring(0, 5000) : '', // 限制大小
                timestamp: new Date().toISOString()
            });
        });
        
        return originalXHRSend.apply(this, arguments);
    };

    // 创建UI
    function createUI() {
        const style = document.createElement('style');
        style.textContent = `
            #request-logger-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 5px;
                padding: 10px;
                z-index: 9999;
                width: 300px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
                font-size: 14px;
                display: none;
            }
            #request-logger-panel.active {
                display: block;
            }
            #request-logger-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                text-align: center;
                font-size: 24px;
                line-height: 50px;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
            }
            #request-logger-toggle:hover {
                background: #3e8e41;
            }
            #request-logger-panel h3 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            #request-logger-panel button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 5px 10px;
                margin: 5px;
                border-radius: 3px;
                cursor: pointer;
            }
            #request-logger-panel button:hover {
                background: #3e8e41;
            }
            #request-logger-panel select, 
            #request-logger-panel input {
                width: 100%;
                padding: 5px;
                margin: 5px 0;
                box-sizing: border-box;
            }
            #request-logger-sessions {
                max-height: 200px;
                overflow-y: auto;
                margin: 10px 0;
            }
            .request-logger-session {
                border: 1px solid #ddd;
                padding: 5px;
                margin-bottom: 5px;
                cursor: pointer;
            }
            .request-logger-session:hover {
                background: #f5f5f5;
            }
        `;
        document.head.appendChild(style);

        const toggle = document.createElement('div');
        toggle.id = 'request-logger-toggle';
        toggle.innerHTML = '📝';
        toggle.title = '请求记录器';
        document.body.appendChild(toggle);

        const panel = document.createElement('div');
        panel.id = 'request-logger-panel';
        panel.innerHTML = `
            <h3>请求记录器</h3>
            <div>
                <button id="request-logger-start">开始记录</button>
                <button id="request-logger-stop" disabled>停止记录</button>
            </div>
            <div id="request-logger-status">状态: 未记录</div>
            <h3>已保存的记录</h3>
            <div id="request-logger-sessions"></div>
        `;
        document.body.appendChild(panel);

        // 事件处理
        toggle.addEventListener('click', function() {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                refreshSessionList();
            }
        });

        document.getElementById('request-logger-start').addEventListener('click', function() {
            store.startCapturing();
            document.getElementById('request-logger-status').textContent = '状态: 记录中...';
            document.getElementById('request-logger-start').disabled = true;
            document.getElementById('request-logger-stop').disabled = false;
        });

        document.getElementById('request-logger-stop').addEventListener('click', function() {
            store.stopCapturing();
            document.getElementById('request-logger-status').textContent = `状态: 已停止 (${store.requests.length} 个请求)`;
            document.getElementById('request-logger-start').disabled = false;
            document.getElementById('request-logger-stop').disabled = true;
            refreshSessionList();
        });
    }

    // 刷新会话列表
    function refreshSessionList() {
        const sessionsContainer = document.getElementById('request-logger-sessions');
        const sessions = store.getSessions();
        
        sessionsContainer.innerHTML = '';
        
        if (sessions.length === 0) {
            sessionsContainer.innerHTML = '<p>没有保存的记录</p>';
            return;
        }
        
        sessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'request-logger-session';
            
            const date = new Date(session.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            sessionDiv.innerHTML = `
                <div>${session.url.substring(0, 30)}${session.url.length > 30 ? '...' : ''}</div>
                <div>时间: ${formattedDate}</div>
                <div>请求数: ${session.requestCount}</div>
                <button class="btn-export" data-id="${session.id}">导出</button>
                <button class="btn-delete" data-id="${session.id}">删除</button>
            `;
            
            sessionDiv.querySelector('.btn-export').addEventListener('click', function(e) {
                e.stopPropagation();
                const sessionId = this.getAttribute('data-id');
                store.exportSession(sessionId);
            });
            
            sessionDiv.querySelector('.btn-delete').addEventListener('click', function(e) {
                e.stopPropagation();
                const sessionId = this.getAttribute('data-id');
                if (confirm('确定要删除这个记录吗?')) {
                    store.deleteSession(sessionId);
                    refreshSessionList();
                }
            });
            
            sessionsContainer.appendChild(sessionDiv);
        });
    }

    // 页面加载完成后创建UI
    window.addEventListener('load', function() {
        createUI();
    });

    // 页面刷新前自动停止捕获
    window.addEventListener('beforeunload', function() {
        if (store.isCapturing) {
            store.stopCapturing();
        }
    });
})(); 