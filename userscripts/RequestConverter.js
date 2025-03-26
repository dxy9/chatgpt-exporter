/**
 * 请求转换工具
 * 用于将请求记录器保存的数据转换为其他格式
 */

/**
 * 将请求记录转换为HAR格式
 * @param {Object} requestData - 请求记录数据对象
 * @returns {Object} HAR格式的数据
 */
function convertToHAR(requestData) {
    const now = new Date();
    
    // 创建HAR对象基本结构
    const har = {
        log: {
            version: '1.2',
            creator: {
                name: '请求记录器',
                version: '1.0'
            },
            browser: {
                name: navigator.userAgent.split(' ').slice(-2, -1)[0],
                version: navigator.userAgent.split(' ').slice(-1)[0]
            },
            pages: [
                {
                    startedDateTime: requestData.timestamp,
                    id: 'page_' + now.getTime(),
                    title: requestData.url,
                    pageTimings: {
                        onContentLoad: -1,
                        onLoad: -1
                    }
                }
            ],
            entries: []
        }
    };
    
    // 转换每个请求为HAR格式
    requestData.requests.forEach((request, index) => {
        // 基本请求信息
        const entry = {
            pageref: 'page_' + now.getTime(),
            startedDateTime: request.timestamp || now.toISOString(),
            time: request.duration || 0,
            request: {
                method: request.method || 'GET',
                url: request.url,
                httpVersion: 'HTTP/1.1',
                cookies: [],
                headers: [],
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: request.status || 0,
                statusText: request.statusText || '',
                httpVersion: 'HTTP/1.1',
                cookies: [],
                headers: [],
                content: {
                    size: request.size || 0,
                    mimeType: 'application/octet-stream',
                    text: request.body || ''
                },
                redirectURL: '',
                headersSize: -1,
                bodySize: request.size || 0
            },
            cache: {},
            timings: {
                send: 0,
                wait: request.duration ? request.duration / 2 : 0,
                receive: request.duration ? request.duration / 2 : 0
            },
            serverIPAddress: '',
            _resourceType: request.initiatorType || 'other',
            connection: '',
            _id: index.toString()
        };
        
        // 转换头信息
        if (request.headers && Array.isArray(request.headers)) {
            request.headers.forEach(header => {
                entry.response.headers.push({
                    name: header[0],
                    value: header[1]
                });
                
                // 检测内容类型
                if (header[0].toLowerCase() === 'content-type') {
                    entry.response.content.mimeType = header[1];
                }
            });
        }
        
        // 处理URL查询参数
        try {
            const url = new URL(request.url);
            url.searchParams.forEach((value, name) => {
                entry.request.queryString.push({ name, value });
            });
        } catch (e) {
            console.error('解析URL失败:', e);
        }
        
        har.log.entries.push(entry);
    });
    
    return har;
}

/**
 * 将请求记录转换为cURL命令
 * @param {Object} request - 单个请求对象
 * @returns {string} cURL命令字符串
 */
function convertToCurl(request) {
    if (!request || !request.url) {
        return '# 无效的请求数据';
    }
    
    let curlCmd = `curl -X ${request.method || 'GET'} "${request.url}"`;
    
    // 添加请求头
    if (request.headers && Array.isArray(request.headers)) {
        request.headers.forEach(header => {
            curlCmd += ` \\\n  -H "${header[0]}: ${header[1]}"`;
        });
    }
    
    // 添加请求体
    if (request.requestBody && request.method !== 'GET') {
        // 尝试检测是否为JSON
        try {
            const jsonBody = JSON.parse(request.requestBody);
            curlCmd += ` \\\n  -d '${JSON.stringify(jsonBody)}'`;
        } catch (e) {
            // 非JSON格式，作为普通文本处理
            curlCmd += ` \\\n  -d '${request.requestBody}'`;
        }
    }
    
    return curlCmd;
}

/**
 * 将请求记录转换为Fetch API代码
 * @param {Object} request - 单个请求对象
 * @returns {string} Fetch API代码字符串
 */
function convertToFetch(request) {
    if (!request || !request.url) {
        return '// 无效的请求数据';
    }
    
    let fetchCode = `// Fetch API 示例代码\n`;
    fetchCode += `fetch("${request.url}", {\n`;
    fetchCode += `  method: "${request.method || 'GET'}",\n`;
    
    // 添加请求头
    if (request.headers && Array.isArray(request.headers)) {
        fetchCode += `  headers: {\n`;
        request.headers.forEach((header, index, array) => {
            fetchCode += `    "${header[0]}": "${header[1]}"${index < array.length - 1 ? ',' : ''}\n`;
        });
        fetchCode += `  },\n`;
    }
    
    // 添加请求体
    if (request.requestBody && request.method !== 'GET') {
        // 尝试检测是否为JSON
        try {
            const jsonBody = JSON.parse(request.requestBody);
            fetchCode += `  body: JSON.stringify(${JSON.stringify(jsonBody)})\n`;
        } catch (e) {
            // 非JSON格式，作为普通文本处理
            fetchCode += `  body: "${request.requestBody}"\n`;
        }
    } else {
        // 删除最后一个逗号
        fetchCode = fetchCode.slice(0, -2) + '\n';
    }
    
    fetchCode += `})\n`;
    fetchCode += `.then(response => response.json())\n`;
    fetchCode += `.then(data => console.log(data))\n`;
    fetchCode += `.catch(error => console.error('请求错误:', error));\n`;
    
    return fetchCode;
}

/**
 * 将请求记录转换为Axios代码
 * @param {Object} request - 单个请求对象
 * @returns {string} Axios代码字符串
 */
function convertToAxios(request) {
    if (!request || !request.url) {
        return '// 无效的请求数据';
    }
    
    let axiosCode = `// Axios 示例代码\n`;
    axiosCode += `axios({\n`;
    axiosCode += `  url: "${request.url}",\n`;
    axiosCode += `  method: "${request.method || 'GET'}",\n`;
    
    // 添加请求头
    if (request.headers && Array.isArray(request.headers)) {
        axiosCode += `  headers: {\n`;
        request.headers.forEach((header, index, array) => {
            axiosCode += `    "${header[0]}": "${header[1]}"${index < array.length - 1 ? ',' : ''}\n`;
        });
        axiosCode += `  },\n`;
    }
    
    // 添加请求体
    if (request.requestBody && request.method !== 'GET') {
        // 尝试检测是否为JSON
        try {
            const jsonBody = JSON.parse(request.requestBody);
            axiosCode += `  data: ${JSON.stringify(jsonBody, null, 2)}\n`;
        } catch (e) {
            // 非JSON格式，作为普通文本处理
            axiosCode += `  data: "${request.requestBody}"\n`;
        }
    } else {
        // 删除最后一个逗号
        axiosCode = axiosCode.slice(0, -2) + '\n';
    }
    
    axiosCode += `})\n`;
    axiosCode += `.then(response => console.log(response.data))\n`;
    axiosCode += `.catch(error => console.error('请求错误:', error));\n`;
    
    return axiosCode;
}

/**
 * 过滤请求记录
 * @param {Array} requests - 请求记录数组
 * @param {Object} filters - 过滤条件
 * @returns {Array} 过滤后的请求记录数组
 */
function filterRequests(requests, filters = {}) {
    return requests.filter(request => {
        // URL包含过滤
        if (filters.url && !request.url.includes(filters.url)) {
            return false;
        }
        
        // 请求方法过滤
        if (filters.method && request.method !== filters.method) {
            return false;
        }
        
        // 状态码过滤
        if (filters.status && request.status !== parseInt(filters.status)) {
            return false;
        }
        
        // 请求类型过滤
        if (filters.type && request.type !== filters.type) {
            return false;
        }
        
        // 通过所有过滤条件
        return true;
    });
}

// 如果在Node.js环境中使用，则导出这些函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convertToHAR,
        convertToCurl,
        convertToFetch,
        convertToAxios,
        filterRequests
    };
} 