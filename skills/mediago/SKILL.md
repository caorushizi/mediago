---
name: mediago
description: >
  Download videos from m3u8/HLS streams, Bilibili, and direct URLs using MediaGo.
  Use when the user wants to download a video, stream, or media file from a URL.
  Also use when the user wants to configure MediaGo connection settings (URL, API key).
  Requires a running MediaGo instance (desktop app, server, or Docker).
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

### First-time Setup

If `~/.mediago-skill.json` does not exist, ask the user:

> "MediaGo service address is not configured yet. Please tell me your MediaGo URL (e.g. `http://localhost:8899` for Docker, or `http://192.168.x.x:39719` for desktop app)."

When the user provides the URL (and optionally an API key), write the config:

```bash
cat > ~/.mediago-skill.json << 'EOF'
{"url":"USER_PROVIDED_URL","apiKey":"USER_PROVIDED_KEY"}
EOF
```

### Updating Config

When the user says things like:

- "设置 mediago 地址为 http://..."
- "mediago api key 是 xxx"
- "我的 mediago 跑在 192.168.1.100:8899"

Read the existing config, update the relevant field, and write it back.

## Downloading Videos

Use the helper script at `${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh`.

### Step 1: Create download task

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh download "VIDEO_URL" "OPTIONAL_NAME" "TYPE"
```

- `VIDEO_URL` (required): The video URL to download
- `OPTIONAL_NAME`: Custom filename (auto-detected if omitted)
- `TYPE`: `m3u8`, `bilibili`, or `direct` (auto-detected from URL if omitted)

Type detection rules:

- URL contains `bilibili.com` or `b23.tv` → `bilibili`
- URL contains `.m3u8` → `m3u8`
- Otherwise → `direct`

The script outputs the task ID on success.

### Step 2: Wait for completion

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh wait TASK_ID
```

This polls every 2 seconds and outputs progress. It exits when the task finishes (success or failure).

### Step 3: Report result

Tell the user:

- On success: "Download complete! File saved to [path]"
- On failure: "Download failed: [error message]"

## Other Commands

```bash
# List all downloads
bash ${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh list

# Get specific task status
bash ${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh status TASK_ID

# Check if MediaGo is reachable
bash ${CLAUDE_SKILL_DIR}/scripts/mediago-api.sh health
```

## Important Notes

- Always check `health` before attempting downloads if you're unsure the service is running.
- If the API returns 401, tell the user their API key may be incorrect and ask them to update it.
- The `wait` command has a 10-minute timeout. For large files, inform the user that the download is still in progress and they can check status manually.
