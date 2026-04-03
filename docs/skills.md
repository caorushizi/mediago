---
layout: doc
outline: deep
---

# OpenClaw Skill

MediaGo 提供了 [OpenClaw](https://docs.openclaw.ai) Skill，让你可以在 AI 编程助手中通过自然语言下载视频。通过 [ClawHub](https://clawhub.com) 安装即可使用。

## 前提条件

- 已安装并运行 MediaGo（桌面客户端或 Docker）
- 已安装支持 OpenClaw 的 AI 编程助手（如 Claude Code、Cursor 等）

## 安装 Skill

在终端中执行以下命令，从 ClawHub 安装 mediago skill：

```bash
npx clawhub@latest install mediago
```

## 初始化配置

安装完成后，需要告诉 AI 助手你的 MediaGo 服务地址。

### 桌面客户端

在 AI 助手中直接发送：

```
设置 mediago 地址为 http://192.168.x.x:39719
```

::: tip
你可以在 MediaGo 桌面客户端的 **设置 → Skills 设置** 中找到已生成的配置命令，一键复制粘贴即可。
:::

### Docker

Docker 部署启用了 API 认证，需要同时配置地址和 API Key：

```
设置 mediago 地址为 http://localhost:8899，api key 为 你的APIKey
```

::: tip
API Key 可以在 MediaGo Web 界面的 **设置 → 更多设置** 中查看。
:::

## 使用方式

配置完成后，你可以用自然语言下载视频：

```
帮我下载这个视频 https://example.com/video.m3u8
```

```
下载这个B站视频 https://www.bilibili.com/video/BV1xxxxxxxx
```

```
download this video https://example.com/stream.m3u8
```

Skill 会自动：

1. 识别视频类型（m3u8 / B站 / 直链）
2. 创建下载任务并开始下载
3. 实时报告下载进度
4. 下载完成后告诉你文件保存位置

## 支持的视频类型

| 类型     | 说明       | URL 示例                                |
| -------- | ---------- | --------------------------------------- |
| m3u8     | HLS 流媒体 | `https://example.com/video.m3u8`        |
| bilibili | B站视频    | `https://www.bilibili.com/video/BVxxxx` |
| direct   | 直链下载   | `https://example.com/video.mp4`         |

## 其他命令

你还可以用自然语言管理下载：

- "查看下载列表" / "list downloads"
- "查看下载状态" / "check download status"
- "修改 mediago 地址" / "update mediago url"

## 常见问题

### 提示连接不上 MediaGo

请确认：

1. MediaGo 服务已启动
2. 配置的地址和端口正确
3. 如果是 Docker，确认端口映射正确（默认 8899）

### 提示 API Key 错误

发送以下命令更新：

```
设置 mediago api key 为 你的新APIKey
```
