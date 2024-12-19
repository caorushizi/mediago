<div align="center">
  <h1>MediaGo</h1>
  <a href="https://downloader.caorushizi.cn/jp/guides.html?form=github">早く始めます</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/jp?form=github">公式サイトです</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/jp/documents.html?form=github">にやすりをかける</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caorushizi/mediago/discussions">Discussions</a>
  <br>
  <br>

  <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/caorushizi/mediago/total">
  <img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/caorushizi/mediago/latest/total">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/caorushizi/mediago">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/caorushizi/mediago">
  <br>
  <br>
  
  <a href="https://trendshift.io/repositories/11083" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/11083" alt="caorushizi%2Fmediago | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
  </a>

  <hr />
</div>

## Intro

本プロジェクトはm3u8ビデオ抽出ツール、ストリーミングダウンロード、m3u8ダウンロードをサポートしています。

- **✅&nbsp; パケットキャプチャ不要**： ソフトウェアに内蔵されたブラウザを使用して、ウェブページ内のビデオリソースを簡単に検出し、検出したリソースリストからダウンロードしたいリソースを選択することで、シンプルかつ迅速にダウンロードできます。
- **📱&nbsp; モバイル再生**： PCとモバイルデバイス間で簡単にシームレスに切り替えが可能で、ダウンロードが完了した後はスマートフォンでビデオを視聴できます。
- **⚡️&nbsp; バッチダウンロード**： 複数のビデオやライブストリームリソースを同時にダウンロードでき、高速帯域幅を無駄にしません。
- **🎉&nbsp; Dockerデプロイメントサポート**： WebエンドをDockerでデプロイすることができ、簡単かつ便利です。

## Quickstart

コードを実行するには、Node.jsとpnpmが必要です。Node.jsは公式ウェブサイトからダウンロードしてインストールし、pnpmは`npm i -g pnpm`コマンドでインストールできます。

## コードの実行

```shell
# コードのダウンロードです
git clone https://github.com/caorushizi/mediago.git

# インストール依存症です
pnpm i

# 開発環境です
pnpm dev

# 梱包して運行します
pnpm release

# dockerミラーリングを構築します
docker buildx build -t caorushizi/mediago:latest .

# docker启动
docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago

```

## Releases

### v3.0.0 (2024.10.7 発売)

#### ソフトウェアダウンロード

- [【mediago】 windows（インストーラー版） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 windows（ポータブル版） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macos arm64（Appleチップ） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macos x64（Intelチップ） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-x64-3.0.0.dmg)
- [【mediago】 linux v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

#### 国内ダウンロード

- [【mediago】 windows（インストーラー版） v3.0.0](https://static.ziying.site/mediago/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 windows（ポータブル版） v3.0.0](https://static.ziying.site/mediago/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macos arm64（Appleチップ） v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macos x64（Intelチップ） v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-x64-3.0.0-beta.5.dmg)
- [【mediago】 linux v3.0.0](https://static.ziying.site/mediago/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

### docker 宝塔パネルワンクリックデプロイ（推奨）

1. 宝塔パネルをインストールし、[宝塔パネル](https://www.bt.cn/new/download.html?r=dk_mediago) の公式サイトから正式版のスクリプトを選択してインストールします。

2. インストール後、宝塔パネルにログインし、メニューから `Docker` をクリックします。初めてアクセスすると、`Docker` サービスをインストールするように指示されるので、「今すぐインストール」をクリックし、指示に従ってインストールを完了します。

3. インストールが完了したら、アプリストアで「MediaGo」を見つけ、インストールをクリックし、ドメイン名などの基本情報を設定してインストールを完了します。

### ソフトウェアスクリーンショット

![ホームページ](https://static.ziying.site/images/home.png)

### 重要な更新

- Web端のdockerデプロイをサポート
- デスクトップ端のUIを更新

### 更新ログ

- デスクトップ端のUIを更新
- Web端のdockerデプロイをサポート
- 新たにビデオ再生機能を追加、デスクトップとモバイル端両方で再生可能
- Macでの画面表示ができない問題を修正
- バッチダウンロードのインタラクションを最適化
- Windowsのポータブル版（インストール不要）を追加
- ダウンロードリストの最適化、ページ内の複数のビデオリソースを嗅ぎ取る機能を追加
- 手動でお気に入りリストのインポートとエクスポートをサポート
- ホームページのダウンロードリストエクスポートをサポート
- 「新規ダウンロード」フォームのインタラクションロジックを最適化
- UrlSchemeでアプリを開き、ダウンロードタスクを追加する機能をサポート
- バグの修正とユーザー体験の向上

## ソフトウェアスクリーンショット

![ホームページ](https://static.ziying.site/images/home.png)

![ホームページ（ダークモード）](https://static.ziying.site/images/home-dark.png)

![設定ページ](https://static.ziying.site/images/settings.png)

![リソース抽出](https://static.ziying.site/images/browser.png)

## 技術スタック

- react <https://react.dev/>
- electron <https://www.electronjs.org>
- koa <https://koajs.com>
- vite <https://cn.vitejs.dev>
- antd <https://ant.design>
- tailwindcss <https://tailwindcss.com>
- shadcn <https://ui.shadcn.com/>
- inversify <https://inversify.io>
- typeorm <https://typeorm.io>

## 感謝

- N_m2u8DL-CLI は <https://github.com/nilaoda/N_m3u8DL-CLI> から来ています
- N_m3u8DL-RE は <https://github.com/nilaoda/N_m3u8DL-RE> から来ています
- mediago は <https://github.com/caorushizi/hls-downloader> から来ています
