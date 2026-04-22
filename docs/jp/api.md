---
layout: doc
outline: deep
---

# ダウンロード API

MediaGo はダウンロードエンジンを HTTP サービスとして公開しています。デスクトップ版はポート `39719` で、Docker デプロイメントはポート `9900` でリッスンします。

HTTP をしゃべれるツール(curl / Python / Node.js / Postman など)なら何でも、この API を直接呼び出してダウンロードタスクの作成、開始、停止、進捗の取得ができます —— MediaGo 自身のブラウザ拡張機能や AI Skill もこの API の利用者です。

## 基本情報

### ベース URL

| デプロイメント | Base URL                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| デスクトップ版 | `http://localhost:39719`                                                     |
| Docker         | `http://<サーバーアドレス>:9900`(実際の `-p` ポートマッピングに合わせて調整) |

すべてのエンドポイントは `/api` プレフィックスの下にあります。以下の例はデスクトップ版のポート `39719` を使っています。Docker 構成の場合はそちらのポートに置き換えてください。

### レスポンス形式

すべての `/api/*` エンドポイントは統一された JSON ラッパー構造を返します:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| フィールド | 型     | 説明                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| `success`  | bool   | ビジネス処理が成功したかどうか                               |
| `code`     | number | ビジネスエラーコード。`0` は成功                             |
| `message`  | string | 人間が読めるメッセージ                                       |
| `data`     | any    | 実際のレスポンスペイロード。エンドポイントにより構造が異なる |

以下の例の「レスポンス」では `data` フィールドの内容のみを示します。

### 認証

- **デスクトップ版**:デフォルトで**認証不要**、`localhost:39719` に直接リクエストするだけ
- **Docker デプロイメント**:認証を有効にした場合、MediaGo の**設定ページ**から API キーを取得し、以降のリクエストに `Authorization: Bearer <key>` ヘッダーを付与します

## クイックスタート

以下の 3 つの curl コマンドで「作成 → ダウンロード開始 → 完了通知」のフローが一通り流れます。

### 1. ダウンロードタスクの作成

```bash
curl -X POST http://localhost:39719/api/downloads \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "type": "m3u8",
        "url": "https://example.com/video.m3u8",
        "name": "私の動画"
      }
    ],
    "startDownload": true
  }'
```

- `type`:ダウンロードタイプ。`m3u8` / `bilibili` / `direct` / `youtube` / `mediago` から選択
- `url`:動画の URL
- `name`:タスク名(保存ファイル名として使われる)
- `startDownload`:作成後すぐにダウンロードを開始するかどうか

レスポンス:

```json
[
  {
    "id": 123,
    "name": "私の動画",
    "type": "m3u8",
    "url": "https://example.com/video.m3u8",
    "status": "waiting",
    "createdDate": "2026-04-23T10:00:00Z"
  }
]
```

返ってきた `id` を控えておいてください。以降のエンドポイントで使います。

### 2. ダウンロードイベントの購読(SSE)

```bash
curl -N http://localhost:39719/api/events
```

これは長時間接続です。サーバーがプッシュした内容がそのまま流れてきます:

```text
event: download-start
data: {"id": "123"}

event: download-success
data: {"id": "123"}
```

ブラウザ / Node.js の場合:

```javascript
const es = new EventSource("http://localhost:39719/api/events");
es.addEventListener("download-success", (e) => {
  const { id } = JSON.parse(e.data);
  console.log("タスク完了:", id);
});
```

### 3. 状態の照会 / 手動制御

```bash
# すべてのダウンロードタスクを一覧表示(ページング)
curl "http://localhost:39719/api/downloads?current=1&pageSize=20"

# 単一のタスクを取得
curl http://localhost:39719/api/downloads/123

# 既存のタスクを開始
curl -X POST http://localhost:39719/api/downloads/123/start \
  -H "Content-Type: application/json" \
  -d '{"localPath": "/Downloads/MediaGo", "deleteSegments": true}'

# タスクを停止
curl -X POST http://localhost:39719/api/downloads/123/stop

# ログを取得
curl http://localhost:39719/api/downloads/123/logs
```

## ダウンロードイベント

`GET /api/events` は Server-Sent Events ストリームです。ダウンロード関連のイベント:

| イベント名         | ペイロード                       | 説明                   |
| ------------------ | -------------------------------- | ---------------------- |
| `download-create`  | `{ids: number[], count: number}` | タスクの一括作成       |
| `download-start`   | `{id: string}`                   | ダウンロード開始       |
| `download-success` | `{id: string}`                   | ダウンロード成功       |
| `download-failed`  | `{id: string, error: string}`    | ダウンロード失敗       |
| `download-stop`    | `{id: string}`                   | ダウンロードを手動停止 |

## エンドポイントリファレンス

### 一覧 / 照会

#### `GET /api/downloads` — ページング付きの一覧取得

**クエリパラメータ:**

- `current` (number, デフォルト 1):ページ番号
- `pageSize` (number, デフォルト 20):ページサイズ
- `filter` (string, 任意):ステータスでフィルタ(`downloading` / `success` / `failed`)
- `localPath` (string, 任意):保存パスでフィルタ

**レスポンス:**

```json
{
  "total": 42,
  "list": [
    /* DownloadTask[] */
  ]
}
```

#### `GET /api/downloads/active` — アクティブなタスクの一覧

`waiting` / `downloading` 状態のタスクをすべて返します。

#### `GET /api/downloads/:id` — 単一タスクの取得

**レスポンス**(`DownloadTask` 構造):

```json
{
  "id": 123,
  "name": "私の動画",
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

#### `GET /api/downloads/folders` — 重複なしの保存ディレクトリ一覧

**レスポンス:** `string[]`

#### `GET /api/downloads/export` — ダウンロードリストのエクスポート

プレーンテキスト、1 行 1 URL。

#### `GET /api/downloads/:id/logs` — ダウンロードログの取得

**レスポンス:** `{ id, log: string }`

### 作成 / 削除

#### `POST /api/downloads` — ダウンロードの一括作成

**リクエストボディ:**

```json
{
  "tasks": [
    {
      "type": "m3u8 | bilibili | direct | youtube | mediago",
      "url": "https://example.com/video.m3u8",
      "name": "タスク名",
      "folder": "任意のサブディレクトリ",
      "headers": "任意、複数行の HTTP ヘッダー"
    }
  ],
  "startDownload": true
}
```

**レスポンス:** `DownloadTask[]`

#### `DELETE /api/downloads/:id` — タスクの削除

**レスポンス:** `{}`

### 編集 / ステータス

#### `PUT /api/downloads/:id` — タスクの編集

**リクエストボディ**(すべて任意):

```json
{
  "name": "新しい名前",
  "url": "新しい URL",
  "headers": "新しいヘッダー",
  "folder": "新しいサブディレクトリ"
}
```

#### `PUT /api/downloads/:id/live` — ライブ配信フラグの切り替え

**リクエストボディ:** `{ "isLive": true }`

#### `PUT /api/downloads/status` — ステータスの一括更新

**リクエストボディ:** `{ "ids": number[], "status": "waiting | downloading | success | failed | stopped" }`

### 開始 / 停止

#### `POST /api/downloads/:id/start` — ダウンロード開始

**リクエストボディ:**

```json
{
  "localPath": "/Users/me/Downloads/MediaGo",
  "deleteSegments": true
}
```

- `localPath`:保存先(絶対パス)
- `deleteSegments`:m3u8 ダウンロード完了後、分割された `.ts` ファイルを削除するかどうか

#### `POST /api/downloads/:id/stop` — ダウンロード停止

**レスポンス:** `{}`

## 列挙値

### ダウンロードタイプ `type`

| 値         | 説明                                              |
| ---------- | ------------------------------------------------- |
| `m3u8`     | HLS ストリーム(内部では N_m3u8DL-RE を使用)       |
| `bilibili` | Bilibili 動画(内部では BBDown を使用)             |
| `direct`   | 直接 HTTP ダウンロード(内部では aria2 を使用)     |
| `youtube`  | YouTube および yt-dlp がサポートする 1000+ サイト |
| `mediago`  | MediaGo 内部タイプ                                |

### タスク状態 `status`

| 値            | 説明                 |
| ------------- | -------------------- |
| `waiting`     | キューに入り、未開始 |
| `downloading` | ダウンロード中       |
| `success`     | 完了                 |
| `failed`      | 失敗                 |
| `stopped`     | 手動停止             |
