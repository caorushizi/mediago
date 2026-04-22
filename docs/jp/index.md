---
layout: home

hero:
  name: "MediaGo"
  text: "クロスプラットフォーム動画ダウンローダー"
  tagline: "ビルトインのスニッフィング — ページを開いて、欲しいリソースを選んで、保存するだけ。パケットキャプチャ不要、プラグイン不要、コマンドライン不要。"
  image:
    src: /home.png
    alt: MediaGo ホーム画面
  actions:
    - theme: brand
      text: すぐに開始
      link: /jp/guides
    - theme: alt
      text: 使用説明
      link: /jp/documents

features:
  - icon: ⏩
    title: パケットキャプチャ不要
    details: デスクトップ版に内蔵ブラウザを搭載、動画ページを開くだけでダウンロード可能なリソースを自動で検出します。Fiddler や Charles などのパケットキャプチャツールは不要です。
  - icon: 🌐
    title: ブラウザ拡張機能（Chrome / Edge）
    details: 普段使いの Chrome / Edge でワンクリック動画スニッフィング。ツールバーアイコンに検出件数を表示し、YouTube、Bilibili など主要な動画サイトに対応。デスクトップ版に同梱。
  - icon: 🎬
    title: 幅広い動画ソースに対応
    details: HLS / m3u8 ストリーム、ライブ配信、Bilibili、YouTube、Twitter/X、Instagram など 1000 以上の動画サイトに対応。内部では N_m3u8DL-RE、BBDown、yt-dlp を使用しています。
  - icon: ⚡️
    title: バッチダウンロード対応
    details: 複数の動画やライブストリーミングを同時にダウンロード。高速な帯域幅を無駄にせず、同時実行数もお好みで調整できます。
  - icon: 🎞️
    title: 内蔵フォーマット変換
    details: ダウンロード完了後、MediaGo 内で他のフォーマットや画質に変換できます。ffmpeg を別途起動する必要はありません。
  - icon: 📱
    title: モバイル再生
    details: デスクトップ版は LAN IP でも待ち受けるため、同じ Wi-Fi のスマートフォンやタブレットから Web UI を開いてダウンロード一覧を参照し、直接再生できます。
  - icon: 🔌
    title: 開放 HTTP API
    details: 完全な HTTP API を提供し、スクリプト、自動化ツール、サードパーティアプリからダウンロードタスクの作成、進捗の取得、リスト管理が可能です。
  - icon: 🦞
    title: OpenClaw Skill
    details: Claude Code や Cursor などの AI コーディングアシスタントに「この動画をダウンロードして」と伝えるだけで OK。ワンコマンドで Skill をインストール。
  - icon: 🐳
    title: Docker ワンライン展開
    details: 1 コマンドで NAS / VPS にデプロイ、同じネットワーク内のブラウザから直接アクセス。Docker Hub と GHCR のマルチアーキテクチャイメージ対応。
---
