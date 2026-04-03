---
layout: doc
outline: deep
---

# OpenClaw Skill

MediaGo provides an [OpenClaw](https://docs.openclaw.ai) Skill that lets you download videos using natural language in your AI coding assistant. Install it via [ClawHub](https://clawhub.com).

## Prerequisites

- MediaGo installed and running (desktop app or Docker)
- An AI coding assistant that supports OpenClaw (e.g. Claude Code, Cursor, etc.)

## Install the Skill

Run the following command in your terminal to install the mediago skill from ClawHub:

```bash
npx clawhub@latest install mediago
```

## Initialize Configuration

After installation, you need to configure your MediaGo service address.

### Desktop App

Send this message in your AI assistant:

```
set mediago url to http://192.168.x.x:39719
```

::: tip
You can find the pre-generated setup command in the MediaGo desktop app under **Settings → Skills** — just copy and paste it.
:::

### Docker

Docker requires API authentication. Configure both the URL and API Key:

```
set mediago url to http://localhost:8899, api key is YOUR_API_KEY
```

::: tip
You can find your API Key in the MediaGo web interface under **Settings → More Settings**.
:::

## Usage

Once configured, you can download videos using natural language:

```
download this video https://example.com/video.m3u8
```

```
download this bilibili video https://www.bilibili.com/video/BV1xxxxxxxx
```

The skill will automatically:

1. Detect the video type (m3u8 / Bilibili / direct)
2. Create a download task and start downloading
3. Report download progress in real-time
4. Tell you the file location when complete

## Supported Video Types

| Type     | Description     | URL Example                             |
| -------- | --------------- | --------------------------------------- |
| m3u8     | HLS streams     | `https://example.com/video.m3u8`        |
| bilibili | Bilibili videos | `https://www.bilibili.com/video/BVxxxx` |
| direct   | Direct download | `https://example.com/video.mp4`         |

## Other Commands

You can also manage downloads using natural language:

- "list downloads"
- "check download status"
- "update mediago url"

## Troubleshooting

### Cannot connect to MediaGo

Please verify:

1. MediaGo service is running
2. The configured URL and port are correct
3. For Docker, ensure port mapping is correct (default 8899)

### API Key error

Update the API key:

```
set mediago api key to YOUR_NEW_API_KEY
```
