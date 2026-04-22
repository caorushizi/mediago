---
layout: doc
outline: deep
---

# 下载接口

MediaGo 把下载核心暴露成一个 HTTP 服务。桌面端在 `39719` 端口,Docker 部署在 `9900` 端口。

你可以用任何支持 HTTP 的工具(curl / Python / Node.js / Postman 等)直接调用接口,新建下载任务、启动、停止、查询进度 —— MediaGo 自己的浏览器扩展、AI Skill 都是这套接口的消费者。

## 基础信息

### 接口地址

| 部署方式 | Base URL                                             |
| -------- | ---------------------------------------------------- |
| 桌面端   | `http://localhost:39719`                             |
| Docker   | `http://<服务器地址>:9900`(按实际 `-p` 端口映射调整) |

所有接口都在 `/api` 前缀下。下文示例默认用桌面端的 `39719` 端口,Docker 部署请自行替换。

### 响应格式

所有 `/api/*` 接口都返回统一的 JSON 包裹结构:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| 字段      | 类型   | 说明                        |
| --------- | ------ | --------------------------- |
| `success` | bool   | 业务是否成功                |
| `code`    | number | 业务错误码,`0` 表示成功     |
| `message` | string | 人类可读的提示              |
| `data`    | any    | 实际响应载荷,结构因接口而异 |

下文示例中的"响应"只展示 `data` 字段的内容。

### 认证

- **桌面端**:默认**无需认证**,直接请求 `localhost:39719` 即可
- **Docker 部署**:启用认证时,在 MediaGo **设置页面**中获取 API Key,之后的请求带 `Authorization: Bearer <key>` 头

## 快速上手

下面这三条命令串起"新建 → 开始下载 → 完成通知"的完整流程。

### 1. 新建下载任务

```bash
curl -X POST http://localhost:39719/api/downloads \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "type": "m3u8",
        "url": "https://example.com/video.m3u8",
        "name": "我的视频"
      }
    ],
    "startDownload": true
  }'
```

- `type`:下载类型,可选 `m3u8` / `bilibili` / `direct` / `youtube` / `mediago`
- `url`:视频链接
- `name`:任务名称(会作为保存文件名)
- `startDownload`:创建后是否立即开始下载

响应:

```json
[
  {
    "id": 123,
    "name": "我的视频",
    "type": "m3u8",
    "url": "https://example.com/video.m3u8",
    "status": "waiting",
    "createdDate": "2026-04-23T10:00:00Z"
  }
]
```

记下返回的 `id`,后续接口会用到。

### 2. 订阅下载事件(SSE)

```bash
curl -N http://localhost:39719/api/events
```

这是一条长连接,服务端推什么、你收什么:

```text
event: download-start
data: {"id": "123"}

event: download-success
data: {"id": "123"}
```

浏览器 / Node.js 里:

```javascript
const es = new EventSource("http://localhost:39719/api/events");
es.addEventListener("download-success", (e) => {
  const { id } = JSON.parse(e.data);
  console.log("任务完成:", id);
});
```

### 3. 查询状态 / 手动控制

```bash
# 列出所有下载任务(分页)
curl "http://localhost:39719/api/downloads?current=1&pageSize=20"

# 查单个任务
curl http://localhost:39719/api/downloads/123

# 启动已存在的任务
curl -X POST http://localhost:39719/api/downloads/123/start \
  -H "Content-Type: application/json" \
  -d '{"localPath": "/Downloads/MediaGo", "deleteSegments": true}'

# 停止任务
curl -X POST http://localhost:39719/api/downloads/123/stop

# 查下载日志
curl http://localhost:39719/api/downloads/123/logs
```

## 下载事件

`GET /api/events` 是 Server-Sent Events 流,下载相关的事件:

| 事件名             | 载荷                             | 说明         |
| ------------------ | -------------------------------- | ------------ |
| `download-create`  | `{ids: number[], count: number}` | 批量创建任务 |
| `download-start`   | `{id: string}`                   | 下载开始     |
| `download-success` | `{id: string}`                   | 下载成功     |
| `download-failed`  | `{id: string, error: string}`    | 下载失败     |
| `download-stop`    | `{id: string}`                   | 下载手动停止 |

## 接口参考

### 列表 / 查询

#### `GET /api/downloads` — 分页列出下载任务

**Query 参数:**

- `current` (number, 默认 1):页码
- `pageSize` (number, 默认 20):每页条数
- `filter` (string, 可选):按状态筛选,如 `downloading` / `success` / `failed`
- `localPath` (string, 可选):按保存路径筛选

**响应:**

```json
{
  "total": 42,
  "list": [
    /* DownloadTask[] */
  ]
}
```

#### `GET /api/downloads/active` — 列出活动中的任务

返回所有 `waiting` / `downloading` 状态的任务。

#### `GET /api/downloads/:id` — 查单个任务

**响应**(`DownloadTask` 结构):

```json
{
  "id": 123,
  "name": "我的视频",
  "type": "m3u8",
  "url": "https://example.com/video.m3u8",
  "folder": "my-folder",
  "headers": "User-Agent: ...",
  "isLive": false,
  "status": "success",
  "file": "/path/to/saved.mp4",
  "createdDate": "2026-04-23T10:00:00Z",
  "updatedDate": "2026-04-23T10:05:30Z"
}
```

#### `GET /api/downloads/folders` — 列出所有不重复的保存目录

**响应:** `string[]`

#### `GET /api/downloads/export` — 导出下载列表

返回纯文本,每行一个 URL。

#### `GET /api/downloads/:id/logs` — 查下载日志

**响应:** `{ id, log: string }`

### 创建 / 删除

#### `POST /api/downloads` — 批量新建下载

**请求体:**

```json
{
  "tasks": [
    {
      "type": "m3u8 | bilibili | direct | youtube | mediago",
      "url": "https://example.com/video.m3u8",
      "name": "任务名",
      "folder": "可选子目录",
      "headers": "可选,多行 HTTP 头"
    }
  ],
  "startDownload": true
}
```

**响应:** `DownloadTask[]`

#### `DELETE /api/downloads/:id` — 删除任务

**响应:** `{}`

### 编辑 / 状态

#### `PUT /api/downloads/:id` — 编辑任务

**请求体**(字段都可选):

```json
{
  "name": "新名字",
  "url": "新 URL",
  "headers": "新的 headers",
  "folder": "新的子目录"
}
```

#### `PUT /api/downloads/:id/live` — 标记 / 取消直播流

**请求体:** `{ "isLive": true }`

#### `PUT /api/downloads/status` — 批量修改任务状态

**请求体:** `{ "ids": number[], "status": "waiting | downloading | success | failed | stopped" }`

### 启动 / 停止

#### `POST /api/downloads/:id/start` — 启动下载

**请求体:**

```json
{
  "localPath": "/Users/me/Downloads/MediaGo",
  "deleteSegments": true
}
```

- `localPath`:保存到哪里(绝对路径)
- `deleteSegments`:m3u8 下载完成后是否删除分段 `.ts` 文件

#### `POST /api/downloads/:id/stop` — 停止下载

**响应:** `{}`

## 枚举值

### 下载类型 `type`

| 值         | 说明                                |
| ---------- | ----------------------------------- |
| `m3u8`     | HLS 流媒体(底层 N_m3u8DL-RE)        |
| `bilibili` | B 站视频(底层 BBDown)               |
| `direct`   | 直接 HTTP 下载(底层 aria2)          |
| `youtube`  | YouTube 及 yt-dlp 支持的 1000+ 站点 |
| `mediago`  | MediaGo 内部类型                    |

### 任务状态 `status`

| 值            | 说明       |
| ------------- | ---------- |
| `waiting`     | 等待开始   |
| `downloading` | 下载中     |
| `success`     | 已完成     |
| `failed`      | 失败       |
| `stopped`     | 已手动停止 |
