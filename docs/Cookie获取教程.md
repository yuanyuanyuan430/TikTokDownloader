# Cookie 获取教程

本教程使用 `Google Chrome` 获取抖音网页版 `Cookie`，不同版本的开发者工具名称可能略有差异。

## Google Chrome 获取方法（推荐）

1. 使用 Chrome 打开 [抖音网页版](https://www.douyin.com/) 并登录账号。
2. 打开开发者工具：macOS 按 `⌘ + ⌥ + I`，Windows 按 `F12` 或 `Ctrl + Shift + I`。
3. 选择 `网络（Network）`，勾选 `保留日志（Preserve log）`，然后刷新页面。
4. 在筛选框输入 `cookie-name:odin_tt`，再打开任意作品或评论区触发请求。
5. 在左侧请求列表选择一个状态为 `200`、域名为 `www.douyin.com` 的请求；不要选择红色的 `CORS 错误` 请求。
6. 右侧依次打开 `标头（Headers）` -> `请求标头（Request Headers）`。
7. 找到 `cookie`，复制冒号后面的完整值。只复制 Cookie 值，不要包含 `Cookie:` 字样，也不要复制 `响应标头` 中的 `Set-Cookie`。
8. 将 Cookie 粘贴到 DouK 工作台的 `请求选项 -> Cookie`，或运行 `main.py` 后选择 `从剪贴板读取 Cookie`。

> Cookie 等同于登录凭证。不要提交到 GitHub、聊天记录或公开截图；如有泄露，请立即退出抖音网页版登录并重新登录。

**截图示例：**

<img src="screenshot/Cookie获取教程1.png" alt="开发人员工具">

## 控制台方法（不适用本项目）

1. 打开浏览器\(可选无痕模式启动\)，访问`https://www.douyin.com/`
2. 登录抖音账号\(可跳过\)
3. 按 `F12` 打开开发人员工具
4. 选择 `控制台` 选项卡
5. 输入 `document.cookie` 后回车确认
6. 检查 `Cookie` 是否包含 `passport_csrf_token` 和 `odin_tt` 字段
7. 如果未包含所需字段，尝试刷新网页或者点击加载任意一个作品的评论区，回到步骤5
8. 全选并复制 `Cookie` 的值
9. 运行 `main.py` ，根据提示写入 `Cookie`

**截图示例：**

<img src="screenshot/Cookie获取教程2.png" alt="开发人员工具">

# device_id 参数

`device_id` 参数获取方法与 Cookie 类似。

<img src="screenshot/device_id获取示例图.png" alt="开发人员工具">
