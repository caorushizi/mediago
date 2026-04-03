---
name: mediago
description: >
  Download videos from m3u8/HLS streams, Bilibili, and direct URLs using MediaGo.
  下载视频、m3u8直播流、B站视频。
  Triggers on: download video, 下载视频, 下载这个链接, 帮我下载, m3u8 download,
  设置mediago地址, configure mediago, mediago api key.
  Requires a running MediaGo instance (desktop app or Docker).
license: MIT
metadata:
  author: caorushizi
  version: "1.0.0"
  homepage: "https://github.com/caorushizi/mediago"
---

# MediaGo Video Downloader

Download videos from m3u8/HLS streams, Bilibili, and direct URLs via a running MediaGo instance.

## Configuration

Config file: `~/.mediago-skill.json`

```json
{
  "url": "http://localhost:8899",
  "apiKey": ""
}
```

### First-time Setup / 首次配置

If `~/.mediago-skill.json` does not exist, show the following message (respond in the user's language):

> EN: "MediaGo is not configured yet. To use this skill:
>
> **1. Install MediaGo** (if you haven't already):
>
> - Desktop app: Download from https://github.com/caorushizi/mediago/releases
> - Docker: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:latest`
>
> **2. Initialize** — tell me your MediaGo address, for example:
>
> - Docker: `设置 mediago 地址为 http://localhost:8899`
> - Desktop app: `设置 mediago 地址为 http://192.168.x.x:39719`"
>
> CN: "MediaGo 还没有配置。要使用此功能：
>
> **1. 安装 MediaGo**（如果还没装）：
>
> - 桌面客户端：从 https://github.com/caorushizi/mediago/releases 下载安装
> - Docker 部署：`docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:latest`
>
> **2. 初始化配置** — 告诉我你的 MediaGo 地址，例如：
>
> - Docker：`设置 mediago 地址为 http://localhost:8899`
> - 桌面客户端：`设置 mediago 地址为 http://192.168.x.x:39719`"

When the user provides the URL (and optionally an API key), write it to `~/.mediago-skill.json`.

### Updating Config / 更新配置

Trigger on phrases like:

- EN: "set mediago url to ...", "mediago api key is ...", "my mediago is at ..."
- CN: "设置 mediago 地址为 ...", "mediago api key 是 ...", "我的 mediago 跑在 ..."

Read the existing config, update the relevant field, and write it back.

## API Reference

All API calls use `curl`. Read `url` and `apiKey` from `~/.mediago-skill.json` before each call.

If `apiKey` is set, add header: `-H "X-API-Key: API_KEY"`

### Health Check

```
curl -s BASE_URL/healthy
```

Returns `{"success":true,...}` if service is running.

### Create & Start Download

```
curl -s -X POST BASE_URL/api/downloads \
  -H "Content-Type: application/json" \
  -d '{"tasks":[{"type":"TYPE","url":"VIDEO_URL","name":"NAME"}],"startDownload":true}'
```

- `type` (required): `m3u8`, `bilibili`, or `direct`
- `url` (required): video URL
- `name` (optional): custom filename

**Type detection from URL:**

- Contains `bilibili.com` or `b23.tv` → `bilibili`
- Contains `.m3u8` → `m3u8`
- Otherwise → `direct`

Response `data` is an array of created tasks. Extract `data[0].id` as the task ID.

### Get Task Status

```
curl -s BASE_URL/api/downloads/TASK_ID
```

Response `data` fields: `id`, `name`, `status`, `type`, `exists`, `file`.

Status values: `pending`, `downloading`, `success`, `failed`, `stopped`.

### List Downloads

```
curl -s "BASE_URL/api/downloads?current=1&pageSize=20"
```

Response: `data.total` (count) and `data.list` (array of tasks).

### Get Config (download directory etc.)

```
curl -s BASE_URL/api/config
```

Returns config including `local` (download directory path).

## Download Workflow / 下载流程

1. **Check config / 检查配置**: Read `~/.mediago-skill.json`. If missing, run the First-time Setup flow above.
2. **Health check / 健康检查**: Verify service is reachable. If not, tell the user MediaGo may not be running and guide them to start it.
3. **Create task / 创建任务**: POST to `/api/downloads` with `startDownload: true`.
4. **Poll progress / 轮询进度**: GET `/api/downloads/TASK_ID` every 3 seconds. Report status to user.
5. **Report result / 报告结果**:
   - `success` → EN: "Download complete! File: [path]" / CN: "下载完成！文件：[path]"
   - `failed` → EN: "Download failed." / CN: "下载失败。"
   - If polling exceeds 5 minutes, tell user the download is still in progress.

## Important Notes / 注意事项

- **Language / 语言**: Always respond in the same language the user is using (Chinese or English).
- If API returns HTTP 401, tell the user their API key may be wrong and ask them to update it.
- Always auto-detect the download type from the URL unless the user specifies it.
- If `name` is not provided, omit it from the request — the server will auto-generate one.
