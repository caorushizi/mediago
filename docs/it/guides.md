---
layout: doc
outline: deep
---

# Avvio rapido

Questa guida ti aiuta a iniziare rapidamente con MediaGo. Supporta anche
[OpenClaw Skill](/it/skills) per scaricare video tramite linguaggio naturale
nei tuoi assistenti AI per programmare.

::: info

v3.5 è la versione più recente. Se incontri problemi in questa release,
lascia pure un feedback: lo gestiremo il prima possibile.

:::

::: tip
Uso su macOS

- **[Chip Intel]** Installa la build x64 dalla pagina release. Dopo l'installazione, consenti le app di sviluppatori non identificati nelle impostazioni Sicurezza del Mac.
- **[Apple Silicon]** Installa la build arm64 dalla pagina release. Dopo l'installazione, esegui `sudo xattr -dr com.apple.quarantine /Applications/mediago-community.app` nel Terminale.

:::

## Download e installazione

### v3.5.0 (rilasciata il 22 aprile 2026)

#### Download software

- [【mediago】 Windows (installer) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-win32-x64-3.5.0.exe)
- [【mediago】 Windows (portable) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-portable-win32-x64-3.5.0.exe)
- [【mediago】 macOS arm64 (Apple Silicon) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-arm64-3.5.0.dmg)
- [【mediago】 macOS x64 (Intel) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-x64-3.5.0.dmg)
- [【mediago】 Linux v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-linux-amd64-3.5.0.deb)
- [**Docker Hub**](https://hub.docker.com/r/caorushizi/mediago): `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago caorushizi/mediago:3.5.0`
- **GHCR**: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:3.5.0`

Le versioni precedenti sono disponibili nella [pagina GitHub Releases](https://github.com/caorushizi/mediago/releases).

#### Novità

- **Estensione browser** (Chrome / Edge): sniffing video con un clic su qualsiasi sito.
- **YouTube e 1000+ siti**: basato su yt-dlp.
- **OpenClaw Skill**: scarica video tramite assistenti AI.
- **API HTTP aperta**: integrazione con script, automazioni e strumenti di terze parti.
- **Conversione formato in app**: scegli formato e qualità dopo il download.
- **Deploy Docker più semplice**: immagini multi-arch su GHCR, montando una sola cartella.
- **Avvio più rapido**: backend riscritto in Go, minore memoria, player integrato.

## Istruzioni operative

### Sniffing video automatico

1. Seleziona "Estrazione risorse"

   ![passaggio 1](../images/guides-step1.png)

2. Inserisci l'URL del video

   ![passaggio 2](../images/guides-step2.png)

3. Clicca "Avvia download" per scaricare il video

   ![passaggio 3](../images/guides-step3.png)

### Download manuale

1. Clicca il pulsante "Nuovo download" in alto a destra

   ![passaggio 1](../images/guides-step4.png)

2. Nella finestra del nuovo download, inserisci "Nome video" e il link "Stream (m3u8)" o "Bilibili"

   ![passaggio 2](../images/guides-step5.png)

3. Clicca per scaricare il video dalla lista

   ![passaggio 3](../images/guides-step3.png)

### Download in batch

![passaggio 3](../images/guides-step6.png)

### Funzioni aggiuntive

1. Converti in audio

   ![passaggio 1](../images/guides-step7.png)

2. Altre funzioni saranno aggiunte in futuro. Restate sintonizzati!

### Riproduzione video

- Riproduzione su PC

  ![passaggio 2](../images/addition-step3.png)

- Riproduzione mobile

  ![passaggio 3](../images/addition-step4.png)

## Inizia a scaricare i tuoi video

È così semplice. Puoi iniziare subito a scaricare i tuoi video.

::: warning
Questo software è destinato esclusivamente a scopi di studio e comunicazione.
:::
