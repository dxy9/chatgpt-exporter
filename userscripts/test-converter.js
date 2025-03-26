/**
 * 请求转换工具测试脚本
 * 这个脚本演示如何使用RequestConverter.js处理导出的请求数据
 * 
 * 使用方法: node test-converter.js <请求数据文件路径>
 */

const fs = require('fs');
const path = require('path');
const converter = require('./RequestConverter.js');

// 检查命令行参数
if (process.argv.length < 3) {
    console.log('使用方法: node test-converter.js <请求数据文件路径>');
    process.exit(1);
}

// 获取请求数据文件路径
const dataFilePath = process.argv[2];

// 读取请求数据
console.log(`正在读取请求数据: ${dataFilePath}`);
let requestData;
try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    requestData = JSON.parse(fileContent);
    console.log(`成功读取数据，包含 ${requestData.requests.length} 个请求`);
} catch (error) {
    console.error(`读取请求数据失败: ${error.message}`);
    process.exit(1);
}

// 创建输出目录
const outputDir = path.join(path.dirname(dataFilePath), 'converted');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    console.log(`创建输出目录: ${outputDir}`);
}

// 转换为HAR格式
console.log('正在转换为HAR格式...');
try {
    // 使用requestData对象模拟浏览器环境
    global.navigator = {
        userAgent: 'Mozilla/5.0 Test Environment'
    };
    
    const harData = converter.convertToHAR(requestData);
    const harFilePath = path.join(outputDir, 'requests.har');
    fs.writeFileSync(harFilePath, JSON.stringify(harData, null, 2), 'utf8');
    console.log(`HAR文件已保存: ${harFilePath}`);
} catch (error) {
    console.error(`转换为HAR格式失败: ${error.message}`);
}

// 提取所有唯一URL
const uniqueUrls = [...new Set(requestData.requests.map(req => req.url))];
console.log(`找到 ${uniqueUrls.length} 个唯一URL`);

// 生成一个基本的HTML报告
console.log('正在生成HTML报告...');
try {
    const requestsByType = {};
    requestData.requests.forEach(req => {
        const type = req.type || req.initiatorType || 'unknown';
        if (!requestsByType[type]) {
            requestsByType[type] = [];
        }
        requestsByType[type].push(req);
    });
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>请求记录报告</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2, h3 { color: #333; }
            .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .request-group { margin: 20px 0; }
            .request { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .request:hover { background: #f9f9f9; }
            .request-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .request-url { font-weight: bold; word-break: break-all; }
            .request-method { font-weight: bold; color: #1e88e5; }
            .request-status { font-weight: bold; }
            .request-status.success { color: #43a047; }
            .request-status.error { color: #e53935; }
            .request-status.redirect { color: #fb8c00; }
            .request-details { display: none; margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .request-toggle { cursor: pointer; color: #1e88e5; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow: auto; }
            .tab { overflow: hidden; border: 1px solid #ccc; background-color: #f1f1f1; border-radius: 5px 5px 0 0; }
            .tab button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 10px 15px; }
            .tab button:hover { background-color: #ddd; }
            .tab button.active { background-color: #ccc; }
            .tabcontent { display: none; padding: 10px; border: 1px solid #ccc; border-top: none; border-radius: 0 0 5px 5px; }
        </style>
    </head>
    <body>
        <h1>请求记录报告</h1>
        <div class="summary">
            <h2>摘要</h2>
            <p>URL: ${requestData.url}</p>
            <p>时间: ${new Date(requestData.timestamp).toLocaleString()}</p>
            <p>总请求数: ${requestData.requests.length}</p>
            <p>唯一URL数: ${uniqueUrls.length}</p>
        </div>
        
        <div class="tab">
            <button class="tablinks" onclick="openTab(event, 'ByType')" id="defaultOpen">按类型</button>
            <button class="tablinks" onclick="openTab(event, 'ByStatus')">按状态码</button>
            <button class="tablinks" onclick="openTab(event, 'ByMethod')">按方法</button>
        </div>
        
        <div id="ByType" class="tabcontent">
    `;
    
    // 按类型分组请求
    Object.keys(requestsByType).forEach(type => {
        const requests = requestsByType[type];
        html += `
            <div class="request-group">
                <h2>${type} (${requests.length})</h2>
        `;
        
        requests.forEach((req, index) => {
            const statusClass = getStatusClass(req.status);
            html += `
                <div class="request">
                    <div class="request-header">
                        <span class="request-method">${req.method || 'GET'}</span>
                        <span class="request-url">${req.url}</span>
                        <span class="request-status ${statusClass}">${req.status || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="request-toggle" onclick="toggleDetails('type_${type}_${index}')">▶ 显示详情</span>
                    </div>
                    <div id="type_${type}_${index}" class="request-details">
                        <div class="tab">
                            <button class="tablinks" onclick="openDetailsTab(event, 'type_${type}_${index}_info')">基本信息</button>
                            <button class="tablinks" onclick="openDetailsTab(event, 'type_${type}_${index}_curl')">cURL</button>
                            <button class="tablinks" onclick="openDetailsTab(event, 'type_${type}_${index}_fetch')">Fetch</button>
                            <button class="tablinks" onclick="openDetailsTab(event, 'type_${type}_${index}_axios')">Axios</button>
                        </div>
                        
                        <div id="type_${type}_${index}_info" class="tabcontent">
                            <h3>基本信息</h3>
                            <p>持续时间: ${req.duration ? req.duration.toFixed(2) + 'ms' : 'N/A'}</p>
                            <p>大小: ${req.size ? formatSize(req.size) : 'N/A'}</p>
                            <p>时间戳: ${new Date(req.timestamp).toLocaleString()}</p>
                            ${req.headers ? `<h4>响应头</h4><pre>${JSON.stringify(req.headers, null, 2)}</pre>` : ''}
                            ${req.body ? `<h4>响应体 (前5000字符)</h4><pre>${req.body}</pre>` : ''}
                        </div>
                        
                        <div id="type_${type}_${index}_curl" class="tabcontent">
                            <h3>cURL命令</h3>
                            <pre>${escapeHtml(converter.convertToCurl(req))}</pre>
                        </div>
                        
                        <div id="type_${type}_${index}_fetch" class="tabcontent">
                            <h3>Fetch API代码</h3>
                            <pre>${escapeHtml(converter.convertToFetch(req))}</pre>
                        </div>
                        
                        <div id="type_${type}_${index}_axios" class="tabcontent">
                            <h3>Axios代码</h3>
                            <pre>${escapeHtml(converter.convertToAxios(req))}</pre>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += `
        </div>
        
        <div id="ByStatus" class="tabcontent">
    `;
    
    // 按状态码分组
    const requestsByStatus = {};
    requestData.requests.forEach(req => {
        const status = req.status ? String(req.status) : 'Unknown';
        if (!requestsByStatus[status]) {
            requestsByStatus[status] = [];
        }
        requestsByStatus[status].push(req);
    });
    
    Object.keys(requestsByStatus).sort().forEach(status => {
        const requests = requestsByStatus[status];
        const statusClass = getStatusClass(status);
        
        html += `
            <div class="request-group">
                <h2>状态码 ${status} (${requests.length})</h2>
        `;
        
        requests.forEach((req, index) => {
            html += `
                <div class="request">
                    <div class="request-header">
                        <span class="request-method">${req.method || 'GET'}</span>
                        <span class="request-url">${req.url}</span>
                        <span class="request-status ${statusClass}">${status}</span>
                    </div>
                    <div>
                        <span class="request-toggle" onclick="toggleDetails('status_${status}_${index}')">▶ 显示详情</span>
                    </div>
                    <div id="status_${status}_${index}" class="request-details">
                        <!-- 详情内容类似于按类型分组的部分 -->
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += `
        </div>
        
        <div id="ByMethod" class="tabcontent">
    `;
    
    // 按HTTP方法分组
    const requestsByMethod = {};
    requestData.requests.forEach(req => {
        const method = req.method || 'GET';
        if (!requestsByMethod[method]) {
            requestsByMethod[method] = [];
        }
        requestsByMethod[method].push(req);
    });
    
    Object.keys(requestsByMethod).sort().forEach(method => {
        const requests = requestsByMethod[method];
        
        html += `
            <div class="request-group">
                <h2>${method} (${requests.length})</h2>
        `;
        
        requests.forEach((req, index) => {
            const statusClass = getStatusClass(req.status);
            html += `
                <div class="request">
                    <div class="request-header">
                        <span class="request-method">${method}</span>
                        <span class="request-url">${req.url}</span>
                        <span class="request-status ${statusClass}">${req.status || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="request-toggle" onclick="toggleDetails('method_${method}_${index}')">▶ 显示详情</span>
                    </div>
                    <div id="method_${method}_${index}" class="request-details">
                        <!-- 详情内容类似于按类型分组的部分 -->
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += `
        </div>
        
        <script>
            function toggleDetails(id) {
                const element = document.getElementById(id);
                if (element.style.display === "block") {
                    element.style.display = "none";
                    element.previousElementSibling.firstElementChild.textContent = "▶ 显示详情";
                } else {
                    element.style.display = "block";
                    element.previousElementSibling.firstElementChild.textContent = "▼ 隐藏详情";
                    
                    // 默认打开第一个选项卡
                    const firstTab = element.querySelector('.tablinks');
                    if (firstTab) {
                        firstTab.click();
                    }
                }
            }
            
            function openTab(evt, tabName) {
                var i, tabcontent, tablinks;
                tabcontent = document.getElementsByClassName("tabcontent");
                for (i = 0; i < tabcontent.length; i++) {
                    if (tabcontent[i].id === "ByType" || tabcontent[i].id === "ByStatus" || tabcontent[i].id === "ByMethod") {
                        tabcontent[i].style.display = "none";
                    }
                }
                tablinks = document.getElementsByClassName("tablinks");
                for (i = 0; i < tablinks.length; i++) {
                    if (tablinks[i].parentElement.className === "tab" && tablinks[i].parentElement.firstElementChild.textContent === "按类型") {
                        tablinks[i].className = tablinks[i].className.replace(" active", "");
                    }
                }
                document.getElementById(tabName).style.display = "block";
                evt.currentTarget.className += " active";
            }
            
            function openDetailsTab(evt, tabName) {
                var i, tabcontent, tablinks;
                const parent = evt.currentTarget.parentElement.parentElement;
                tabcontent = parent.getElementsByClassName("tabcontent");
                for (i = 0; i < tabcontent.length; i++) {
                    tabcontent[i].style.display = "none";
                }
                tablinks = parent.getElementsByClassName("tablinks");
                for (i = 0; i < tablinks.length; i++) {
                    tablinks[i].className = tablinks[i].className.replace(" active", "");
                }
                document.getElementById(tabName).style.display = "block";
                evt.currentTarget.className += " active";
            }
            
            // 打开默认选项卡
            document.getElementById("defaultOpen").click();
        </script>
    </body>
    </html>
    `;
    
    const htmlFilePath = path.join(outputDir, 'report.html');
    fs.writeFileSync(htmlFilePath, html, 'utf8');
    console.log(`HTML报告已保存: ${htmlFilePath}`);
} catch (error) {
    console.error(`生成HTML报告失败: ${error.message}`);
}

// 生成示例cURL命令文件
console.log('正在生成cURL命令文件...');
try {
    // 过滤出AJAX请求
    const ajaxRequests = converter.filterRequests(requestData.requests, {
        type: 'fetch'
    });
    
    if (ajaxRequests.length === 0) {
        console.log('未找到AJAX请求，尝试使用XHR请求代替');
        ajaxRequests.push(...converter.filterRequests(requestData.requests, {
            type: 'xhr'
        }));
    }
    
    if (ajaxRequests.length > 0) {
        let curlContent = `# 请求记录的cURL命令示例\n# 生成时间: ${new Date().toLocaleString()}\n# 请求数据源: ${dataFilePath}\n\n`;
        
        ajaxRequests.forEach((req, index) => {
            curlContent += `# 请求 ${index + 1}: ${req.method || 'GET'} ${req.url}\n`;
            curlContent += `# 状态码: ${req.status || 'N/A'}\n`;
            curlContent += converter.convertToCurl(req) + '\n\n';
        });
        
        const curlFilePath = path.join(outputDir, 'curl_commands.sh');
        fs.writeFileSync(curlFilePath, curlContent, 'utf8');
        console.log(`cURL命令文件已保存: ${curlFilePath}`);
    } else {
        console.log('未找到适合转换为cURL的请求');
    }
} catch (error) {
    console.error(`生成cURL命令文件失败: ${error.message}`);
}

console.log('转换完成！');

/**
 * 根据状态码获取CSS类
 * @param {string|number} status - HTTP状态码
 * @returns {string} CSS类名
 */
function getStatusClass(status) {
    if (!status) return '';
    status = Number(status);
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    if (status >= 400) return 'error';
    return '';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 转义HTML字符
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
} 