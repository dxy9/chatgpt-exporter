# 请求记录器油猴脚本

这个目录包含了用于记录浏览器网络请求的油猴脚本及其相关工具。

## 目录内容

- `RequestLogger.user.js` - 主要的油猴脚本，用于捕获和保存网络请求
- `RequestConverter.js` - 将保存的请求数据转换为各种格式的工具
- `config-example.js` - 脚本配置示例文件

## 功能介绍

请求记录器是一个强大的浏览器油猴脚本，可以帮助你捕获和分析浏览器页面刷新时发生的所有网络请求。主要功能包括：

- 捕获页面上发生的所有网络请求
- 记录请求的详细信息，如URL、方法、状态、响应内容等
- 提供友好的用户界面，方便查看和管理请求记录
- 支持导出请求数据为JSON格式
- 可以手动开始和停止记录过程
- 提供多种格式转换工具，如HAR、cURL、Fetch API和Axios

## 安装方法

1. 首先，确保你的浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 下载 `RequestLogger.user.js` 文件
3. 打开 Tampermonkey 扩展的管理面板
4. 点击 "实用工具" 标签
5. 在 "导入" 部分，选择刚才下载的 `.js` 文件
6. 点击 "安装" 

或者你也可以：

1. 打开 `RequestLogger.user.js` 文件的原始视图
2. Tampermonkey 会自动识别并提示安装
3. 点击 "安装" 按钮

## 使用方法

### 基本使用

安装脚本后，在任何网页上：

1. 右下角会出现一个绿色的 "📝" 按钮
2. 点击该按钮打开请求记录器面板
3. 点击 "开始记录" 开始捕获请求
4. 刷新页面或进行你想要监控的操作
5. 点击 "停止记录" 结束捕获
6. 在 "已保存的记录" 部分查看和管理捕获的会话

### 管理记录

对于每个已保存的记录，你可以：

- 查看记录的基本信息，如URL、时间和请求数量
- 点击 "导出" 将记录导出为JSON文件
- 点击 "删除" 删除不需要的记录

### 转换请求数据

使用 `RequestConverter.js` 可以将导出的JSON数据转换为不同格式：

```javascript
// 导入转换工具
const converter = require('./RequestConverter.js');

// 加载导出的请求数据
const requestData = JSON.parse(fs.readFileSync('requests_data.json', 'utf8'));

// 转换为HAR格式
const harData = converter.convertToHAR(requestData);
fs.writeFileSync('requests.har', JSON.stringify(harData), 'utf8');

// 转换单个请求为cURL命令
const curlCommand = converter.convertToCurl(requestData.requests[0]);
console.log(curlCommand);

// 转换单个请求为Fetch API代码
const fetchCode = converter.convertToFetch(requestData.requests[0]);
console.log(fetchCode);

// 转换单个请求为Axios代码
const axiosCode = converter.convertToAxios(requestData.requests[0]);
console.log(axiosCode);

// 过滤请求
const filteredRequests = converter.filterRequests(requestData.requests, {
    method: 'POST',
    url: 'api'
});
console.log(`找到 ${filteredRequests.length} 个匹配的请求`);
```

### 自定义配置

如果你想自定义脚本的行为，可以：

1. 复制 `config-example.js` 并重命名为 `config.js`
2. 根据需要修改配置项
3. 在 `RequestLogger.user.js` 中引入此配置文件

配置选项包括：

- UI配置：按钮位置、颜色、图标等
- 捕获配置：过滤规则、捕获内容限制等
- 存储配置：会话数量限制、过期清理等

## 高级功能

脚本通过多种方式捕获请求：

1. Performance Observer API - 捕获资源加载
2. Fetch API 拦截 - 捕获 fetch 请求和响应
3. XMLHttpRequest 拦截 - 捕获 XHR 请求和响应

每种请求都会记录详细信息，包括但不限于：

- 请求URL
- 请求方法 (GET, POST等)
- 请求和响应头信息
- 响应状态
- 响应体内容 (限制大小以避免性能问题)
- 请求执行时间

## 注意事项

- 为避免性能问题，响应体内容会被限制为最多5000个字符
- 请求记录会保存在浏览器的本地存储中，不会上传到任何服务器
- 页面刷新前会自动停止记录并保存数据
- 如果要处理大量请求，建议调整配置中的过滤规则，避免记录不必要的资源请求

## 开发与贡献

如需进一步开发或修改此脚本，请参考油猴脚本API文档：
[Tampermonkey documentation](https://www.tampermonkey.net/documentation.php)

## 许可证

MIT 