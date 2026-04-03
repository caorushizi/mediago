---
layout: doc
outline: deep
---

# OpenClaw Skill

MediaGo は [OpenClaw](https://docs.openclaw.ai) Skill を提供しており、AI コーディングアシスタントで自然言語を使って動画をダウンロードできます。[ClawHub](https://clawhub.com) からインストールできます。

## 前提条件

- MediaGo がインストール済みで実行中であること（デスクトップアプリまたは Docker）
- OpenClaw 対応の AI コーディングアシスタントがインストール済みであること（Claude Code、Cursor など）

## Skill のインストール

ターミナルで以下のコマンドを実行して、ClawHub から mediago skill をインストールします：

```bash
npx clawhub@latest install mediago
```

## 初期設定

インストール後、AI アシスタントに MediaGo サービスのアドレスを設定する必要があります。

### デスクトップアプリ

AI アシスタントで以下のメッセージを送信します：

```
set mediago url to http://192.168.x.x:39719
```

::: tip
MediaGo デスクトップアプリの **設定 → Skills 設定** に生成済みの設定コマンドがあります。コピーして貼り付けるだけで完了です。
:::

### Docker

Docker では API 認証が必要です。アドレスと API Key の両方を設定します：

```
set mediago url to http://localhost:8899, api key is YOUR_API_KEY
```

::: tip
API Key は MediaGo Web インターフェースの **設定 → その他の設定** で確認できます。
:::

## 使い方

設定完了後、自然言語を使って動画をダウンロードできます：

```
download this video https://example.com/video.m3u8
```

```
download this bilibili video https://www.bilibili.com/video/BV1xxxxxxxx
```

Skill は自動的に：

1. 動画タイプを検出（m3u8 / Bilibili / 直接リンク）
2. ダウンロードタスクを作成して開始
3. ダウンロード進捗をリアルタイムで報告
4. 完了後にファイルの保存場所を通知

## サポートする動画タイプ

| タイプ   | 説明             | URL 例                                  |
| -------- | ---------------- | --------------------------------------- |
| m3u8     | HLS ストリーム   | `https://example.com/video.m3u8`        |
| bilibili | Bilibili 動画    | `https://www.bilibili.com/video/BVxxxx` |
| direct   | 直接ダウンロード | `https://example.com/video.mp4`         |

## トラブルシューティング

### MediaGo に接続できない

以下を確認してください：

1. MediaGo サービスが実行中であること
2. 設定したアドレスとポートが正しいこと
3. Docker の場合、ポートマッピングが正しいこと（デフォルト 8899）

### API Key エラー

API Key を更新します：

```
set mediago api key to YOUR_NEW_API_KEY
```
