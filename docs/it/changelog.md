---
layout: doc
outline: deep
---

# Changelog

## v3.5.0 (rilasciata il 22/04/2026)

### Download software

- [【mediago】 Windows (installer) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-win32-x64-3.5.0.exe)
- [【mediago】 Windows (portable) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-portable-win32-x64-3.5.0.exe)
- [【mediago】 macOS arm64 (Apple Silicon) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-arm64-3.5.0.dmg)
- [【mediago】 macOS x64 (Intel) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-x64-3.5.0.dmg)
- [【mediago】 Linux v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-linux-amd64-3.5.0.deb)
- [**Docker Hub**](https://hub.docker.com/r/caorushizi/mediago): `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago caorushizi/mediago:3.5.0`
- **GHCR**: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:3.5.0`

### Punti principali

- **🌐 Estensione browser (Chrome / Edge)** — sniffing video con un clic su qualsiasi sito, inviato direttamente a MediaGo.
- **🎬 YouTube e 1000+ siti** — basato su yt-dlp.
- **🦞 OpenClaw Skill** — scarica video tramite assistenti AI usando linguaggio naturale.
- **🔌 API HTTP aperta** — integrazione con script, automazioni e strumenti di terze parti.
- **🎞️ Conversione formato in app** — scegli formato e qualità dopo il completamento del download.
- **🐳 Deploy Docker più semplice** — immagini multi-arch (x86 / ARM) su GitHub Container Registry, montando una sola cartella.
- **⚡ Avvio più rapido** — backend riscritto in Go, minore consumo di memoria, player video integrato.

## v3.0.0 (rilasciata il 07/10/2024)

### Download software

- [【mediago】 Windows (installer) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 Windows (portable) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macOS ARM64 (Apple Chip) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macOS x64 (Intel Chip) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-x64-3.0.0.dmg)
- [【mediago】 Linux v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 Docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

### Download in Cina

- [【mediago】 Windows (installer) v3.0.0](https://static.ziying.site/mediago/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 Windows (portable) v3.0.0](https://static.ziying.site/mediago/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macOS ARM64 (Apple Chip) v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macOS x64 (Intel Chip) v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-x64-3.0.0-beta.5.dmg)
- [【mediago】 Linux v3.0.0](https://static.ziying.site/mediago/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 Docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

### Screenshot software

![Home](../images/changelog4.png)

### Aggiornamenti principali

- Supporto al deploy Docker della versione web
- UI desktop aggiornata

### Changelog

- UI desktop aggiornata
- Supporto al deploy Docker della versione web
- Aggiunta riproduzione video, con supporto desktop e mobile
- Corretto un problema per cui la versione Mac non mostrava l'interfaccia
- Ottimizzata l'interazione del download batch
- Aggiunta versione portable per Windows, senza installazione
- Ottimizzata la lista download per supportare lo sniffing di più video nella stessa pagina
- Supporto a import/export manuale della lista preferiti
- Supporto all'export della lista download in homepage
- Ottimizzata la logica di interazione del modulo "Nuovo download"
- Supporto all'apertura dell'app tramite UrlScheme e aggiunta di attività download
- Correzione di diversi bug e miglioramento dell'esperienza utente

## v2.2.3 (rilasciata il 06/07/2024)

### Link download

- [Windows mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-x64-2.2.3.exe)
- [macOS mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-x64-2.2.3.dmg)
- [Linux mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-arm64-2.2.3.dmg)

### Changelog

- Aggiunto toggle "Aggiornamento automatico" nelle impostazioni: solo le versioni release verranno aggiornate automaticamente, non le beta
- Aggiunto "Aggiornamento batch" nel modulo download
- Rilasciata nuova versione Linux
- Selezione automatica della massima qualità video durante il download
- Aggiunti "Cancella cache" e "Modalità incognito"
- Selezione personalizzata del percorso di installazione
- Correzione di diversi bug

## v2.2.0 (rilasciata il 22/05/2024)

### Link download

- [Windows mediago v2.2.0](https://github.com/caorushizi/mediago/releases/download/v2.2.0/mediago-setup-2.2.0.exe)
- [macOS mediago v2.2.0](https://github.com/caorushizi/mediago/releases/download/v2.2.0/mediago-setup-2.2.0.dmg)

### Changelog

- Supporto al download di live stream
- Supporto al download video Bilibili
- Ottimizzazione del processo di sniffing immersivo
- Supporto all'output console durante il download
- Correzione di diversi bug

## v2.0.1 (rilasciata il 01/07/2023)

### Link download

- [Windows mediago v2.0.1](https://github.com/caorushizi/mediago/releases/download/v2.0.1/media-downloader-setup-2.0.1.exe)
- [macOS mediago v2.0.1](https://github.com/caorushizi/mediago/releases/download/v2.0.1/media-downloader-setup-2.0.1.dmg)

### Screenshot software

![Home](../images/changelog3.png)

### Changelog

- Modalità scura
- Più configurazioni di download
- Supporto all'iniezione automatica degli header
- Supporto all'abilitazione del filtro annunci
- Supporto allo sniffing immersivo
- Supporto al cambio tra modalità mobile e PC
- Supporto alla modifica del limite di download simultanei
- Correzione di diversi bug

## v1.1.5 (rilasciata il 05/02/2022)

### Link download

- [Windows mediago v1.1.5](https://github.com/caorushizi/mediago/releases/download/1.1.5/media-downloader-setup-1.1.4.exe)

### Screenshot software

![Home](../images/changelog2.webp)

### Changelog

- Supporto al download video

## v1.0.1 (rilasciata il 01/03/2021)

### Screenshot software

![Home](../images/changelog1.webp)

### Changelog

- Supporto al download video
