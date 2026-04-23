---
layout: doc
outline: deep
---

# OpenClaw Skill

MediaGo fornisce una [OpenClaw](https://docs.openclaw.ai) Skill che ti permette di scaricare video usando linguaggio naturale nel tuo assistente AI per programmare. Installala tramite [ClawHub](https://clawhub.com).

## Prerequisiti

- MediaGo installato e in esecuzione (app desktop o Docker)
- Un assistente AI che supporta OpenClaw, ad esempio Claude Code, Cursor, ecc.

## Installare la Skill

Esegui questo comando nel terminale per installare la skill mediago da ClawHub:

```bash
npx clawhub@latest install mediago
```

## Inizializzare la configurazione

Dopo l'installazione devi configurare l'indirizzo del servizio MediaGo.

### App desktop

Invia questo messaggio al tuo assistente AI:

```
set mediago url to http://192.168.x.x:39719
```

::: tip
Puoi trovare il comando di configurazione già generato nell'app desktop MediaGo sotto **Impostazioni → Skills**: copialo e incollalo.
:::

### Docker

Docker richiede autenticazione API. Configura sia l'URL sia l'API Key:

```
set mediago url to http://localhost:8899, api key is YOUR_API_KEY
```

::: tip
Puoi trovare la tua API Key nell'interfaccia web MediaGo sotto **Impostazioni → Altre impostazioni**.
:::

## Utilizzo

Una volta configurata, puoi scaricare video con linguaggio naturale:

```
download this video https://example.com/video.m3u8
```

```
download this bilibili video https://www.bilibili.com/video/BV1xxxxxxxx
```

La skill farà automaticamente:

1. Rilevare il tipo di video (m3u8 / Bilibili / direct)
2. Creare un'attività di download e avviarla
3. Riportare l'avanzamento in tempo reale
4. Indicarti il percorso del file al termine

## Tipi video supportati

| Tipo     | Descrizione      | Esempio URL                             |
| -------- | ---------------- | --------------------------------------- |
| m3u8     | Stream HLS       | `https://example.com/video.m3u8`        |
| bilibili | Video Bilibili   | `https://www.bilibili.com/video/BVxxxx` |
| direct   | Download diretto | `https://example.com/video.mp4`         |

## Altri comandi

Puoi anche gestire i download con linguaggio naturale:

- "list downloads"
- "check download status"
- "update mediago url"

## Risoluzione problemi

### Impossibile connettersi a MediaGo

Verifica:

1. Il servizio MediaGo è in esecuzione
2. URL e porta configurati sono corretti
3. Per Docker, la mappatura porta è corretta (default 8899)

### Errore API Key

Aggiorna l'API key:

```
set mediago api key to YOUR_NEW_API_KEY
```
