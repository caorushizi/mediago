---
layout: doc
outline: deep
---

# Download API

MediaGo exposes its download engine as an HTTP service. The desktop app listens on port `39719`; the Docker deployment listens on port `9900`.

You can drive it from anything that speaks HTTP — curl, Python, Node.js, Postman, your own scripts, automation platforms. MediaGo's own browser extension and AI Skill are just consumers of this API.

## Basics

### Base URL

| Deployment | Base URL                                                |
| ---------- | ------------------------------------------------------- |
| Desktop    | `http://localhost:39719`                                |
| Docker     | `http://<your-host>:9900` (adjust to your port mapping) |

All endpoints live under the `/api` prefix. The examples below use the desktop port `39719` by default — swap in your Docker port if that's what you're targeting.

### Response envelope

Every `/api/*` endpoint returns this JSON wrapper:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| Field     | Type   | Notes                                          |
| --------- | ------ | ---------------------------------------------- |
| `success` | bool   | Whether the call succeeded                     |
| `code`    | number | Business error code, `0` on success            |
| `message` | string | Human-readable hint                            |
| `data`    | any    | The actual payload — shape varies per endpoint |

Example responses below only show the `data` body.

### Authentication

- **Desktop**: no auth by default, just hit `localhost:39719`
- **Docker**: when auth is enabled, grab the API key from MediaGo's **Settings** page, then include `Authorization: Bearer <key>` on every request

## Quick start

Three curl commands that walk through the whole "create → download → get notified" flow.

### 1. Create a download task

```bash
curl -X POST http://localhost:39719/api/downloads \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "type": "m3u8",
        "url": "https://example.com/video.m3u8",
        "name": "My Video"
      }
    ],
    "startDownload": true
  }'
```

- `type`: download type — `m3u8` / `bilibili` / `direct` / `youtube` / `mediago`
- `url`: video URL
- `name`: task name (used as the saved file name)
- `startDownload`: whether to start immediately after creation

Response:

```json
[
  {
    "id": 123,
    "name": "My Video",
    "type": "m3u8",
    "url": "https://example.com/video.m3u8",
    "status": "waiting",
    "createdDate": "2026-04-23T10:00:00Z"
  }
]
```

Keep the `id` — you'll need it later.

### 2. Subscribe to download events (SSE)

```bash
curl -N http://localhost:39719/api/events
```

A long-lived connection — whatever the server emits, you receive:

```text
event: download-start
data: {"id": "123"}

event: download-success
data: {"id": "123"}
```

In the browser / Node.js:

```javascript
const es = new EventSource("http://localhost:39719/api/events");
es.addEventListener("download-success", (e) => {
  const { id } = JSON.parse(e.data);
  console.log("Done:", id);
});
```

### 3. Query / manually control

```bash
# List all downloads (paginated)
curl "http://localhost:39719/api/downloads?current=1&pageSize=20"

# Get one task
curl http://localhost:39719/api/downloads/123

# Start an existing task
curl -X POST http://localhost:39719/api/downloads/123/start \
  -H "Content-Type: application/json" \
  -d '{"localPath": "/Downloads/MediaGo", "deleteSegments": true}'

# Stop a task
curl -X POST http://localhost:39719/api/downloads/123/stop

# Get logs
curl http://localhost:39719/api/downloads/123/logs
```

## Download events

`GET /api/events` is a Server-Sent Events stream. Download-related events:

| Event              | Payload                          | Notes                     |
| ------------------ | -------------------------------- | ------------------------- |
| `download-create`  | `{ids: number[], count: number}` | Bulk task creation        |
| `download-start`   | `{id: string}`                   | Download started          |
| `download-success` | `{id: string}`                   | Download completed        |
| `download-failed`  | `{id: string, error: string}`    | Download failed           |
| `download-stop`    | `{id: string}`                   | Download manually stopped |

## Endpoint reference

### List / query

#### `GET /api/downloads` — paginated list

**Query params:**

- `current` (number, default 1) — page number
- `pageSize` (number, default 20) — page size
- `filter` (string, optional) — status filter (`downloading` / `success` / `failed`)
- `localPath` (string, optional) — save-path filter

**Response:**

```json
{
  "total": 42,
  "list": [
    /* DownloadTask[] */
  ]
}
```

#### `GET /api/downloads/active` — list active tasks

Returns all tasks in `waiting` or `downloading` state.

#### `GET /api/downloads/:id` — get one task

**Response** (`DownloadTask` shape):

```json
{
  "id": 123,
  "name": "My Video",
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

#### `GET /api/downloads/folders` — list unique save directories

**Response:** `string[]`

#### `GET /api/downloads/export` — export URL list

Plain text, one URL per line.

#### `GET /api/downloads/:id/logs` — fetch download logs

**Response:** `{ id, log: string }`

### Create / delete

#### `POST /api/downloads` — batch create downloads

**Body:**

```json
{
  "tasks": [
    {
      "type": "m3u8 | bilibili | direct | youtube | mediago",
      "url": "https://example.com/video.m3u8",
      "name": "Task name",
      "folder": "optional subdir",
      "headers": "optional multi-line HTTP headers"
    }
  ],
  "startDownload": true
}
```

**Response:** `DownloadTask[]`

#### `DELETE /api/downloads/:id` — delete task

**Response:** `{}`

### Edit / status

#### `PUT /api/downloads/:id` — edit task

**Body** (all fields optional):

```json
{
  "name": "New name",
  "url": "New URL",
  "headers": "New headers",
  "folder": "New subdir"
}
```

#### `PUT /api/downloads/:id/live` — toggle live-stream flag

**Body:** `{ "isLive": true }`

#### `PUT /api/downloads/status` — bulk status update

**Body:** `{ "ids": number[], "status": "waiting | downloading | success | failed | stopped" }`

### Start / stop

#### `POST /api/downloads/:id/start` — start download

**Body:**

```json
{
  "localPath": "/Users/me/Downloads/MediaGo",
  "deleteSegments": true
}
```

- `localPath`: where to save (absolute path)
- `deleteSegments`: for m3u8 downloads, whether to delete segment `.ts` files after merging

#### `POST /api/downloads/:id/stop` — stop download

**Response:** `{}`

## Enum values

### Download type `type`

| Value      | Notes                                      |
| ---------- | ------------------------------------------ |
| `m3u8`     | HLS streams (backed by N_m3u8DL-RE)        |
| `bilibili` | Bilibili videos (backed by BBDown)         |
| `direct`   | Direct HTTP download (backed by aria2)     |
| `youtube`  | YouTube and 1000+ sites (backed by yt-dlp) |
| `mediago`  | MediaGo internal type                      |

### Task status `status`

| Value         | Notes               |
| ------------- | ------------------- |
| `waiting`     | Queued, not started |
| `downloading` | In progress         |
| `success`     | Completed           |
| `failed`      | Errored out         |
| `stopped`     | Manually stopped    |
