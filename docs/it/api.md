---
layout: doc
outline: deep
---

# API di download

MediaGo espone il proprio motore di download come servizio HTTP. L'app desktop ascolta sulla porta `39719`; il deploy Docker ascolta sulla porta `9900`.

Puoi controllarlo da qualsiasi strumento che parli HTTP: curl, Python, Node.js, Postman, script personali o piattaforme di automazione. L'estensione browser e la Skill AI di MediaGo sono semplicemente consumer di questa API.

## Nozioni di base

### Base URL

| Deploy  | Base URL                                                    |
| ------- | ----------------------------------------------------------- |
| Desktop | `http://localhost:39719`                                    |
| Docker  | `http://<your-host>:9900` (adatta alla tua mappatura porta) |

Tutti gli endpoint sono sotto il prefisso `/api`. Gli esempi usano la porta desktop `39719` per impostazione predefinita: sostituiscila con la porta Docker se stai usando quel deploy.

### Envelope della risposta

Ogni endpoint `/api/*` restituisce questo wrapper JSON:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| Campo     | Tipo   | Note                                      |
| --------- | ------ | ----------------------------------------- |
| `success` | bool   | Indica se la chiamata è riuscita          |
| `code`    | number | Codice errore business, `0` se riuscita   |
| `message` | string | Suggerimento leggibile                    |
| `data`    | any    | Payload effettivo, variabile per endpoint |

Gli esempi sotto mostrano solo il corpo `data`.

### Autenticazione

- **Desktop**: nessuna autenticazione predefinita, usa `localhost:39719`
- **Docker**: se l'autenticazione è abilitata, copia l'API key dalla pagina **Impostazioni** di MediaGo e includi `Authorization: Bearer <key>` in ogni richiesta

## Avvio rapido

Tre comandi curl per il flusso "crea → scarica → ricevi notifica".

### 1. Crea un'attività di download

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

- `type`: tipo di download — `m3u8` / `bilibili` / `direct` / `youtube` / `mediago`
- `url`: URL del video
- `name`: nome dell'attività, usato come nome file salvato
- `startDownload`: se avviare subito dopo la creazione

Risposta:

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

Conserva l'`id`: ti servirà dopo.

### 2. Sottoscrivi gli eventi di download (SSE)

```bash
curl -N http://localhost:39719/api/events
```

È una connessione persistente: ricevi tutto ciò che il server emette.

```text
event: download-start
data: {"id": "123"}

event: download-success
data: {"id": "123"}
```

Nel browser / Node.js:

```javascript
const es = new EventSource("http://localhost:39719/api/events");
es.addEventListener("download-success", (e) => {
  const { id } = JSON.parse(e.data);
  console.log("Done:", id);
});
```

### 3. Consulta / controlla manualmente

```bash
# Lista tutti i download (paginata)
curl "http://localhost:39719/api/downloads?current=1&pageSize=20"

# Ottieni una singola attività
curl http://localhost:39719/api/downloads/123

# Avvia un'attività esistente
curl -X POST http://localhost:39719/api/downloads/123/start \
  -H "Content-Type: application/json" \
  -d '{"localPath": "/Downloads/MediaGo", "deleteSegments": true}'

# Ferma un'attività
curl -X POST http://localhost:39719/api/downloads/123/stop

# Ottieni i log
curl http://localhost:39719/api/downloads/123/logs
```

## Eventi di download

`GET /api/events` è uno stream Server-Sent Events. Eventi legati al download:

| Evento             | Payload                          | Note                         |
| ------------------ | -------------------------------- | ---------------------------- |
| `download-create`  | `{ids: number[], count: number}` | Creazione batch              |
| `download-start`   | `{id: string}`                   | Download avviato             |
| `download-success` | `{id: string}`                   | Download completato          |
| `download-failed`  | `{id: string, error: string}`    | Download fallito             |
| `download-stop`    | `{id: string}`                   | Download fermato manualmente |

## Riferimento endpoint

### Lista / query

#### `GET /api/downloads` — lista paginata

**Query params:**

- `current` (number, default 1) — numero pagina
- `pageSize` (number, default 20) — dimensione pagina
- `filter` (string, opzionale) — filtro stato (`downloading` / `success` / `failed`)
- `localPath` (string, opzionale) — filtro percorso di salvataggio

**Risposta:**

```json
{
  "total": 42,
  "list": [
    /* DownloadTask[] */
  ]
}
```

#### `GET /api/downloads/active` — lista attività attive

Restituisce tutte le attività in stato `waiting` o `downloading`.

#### `GET /api/downloads/:id` — ottieni una attività

**Risposta** (forma `DownloadTask`):

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

#### `GET /api/downloads/folders` — lista directory di salvataggio uniche

**Risposta:** `string[]`

#### `GET /api/downloads/export` — esporta lista URL

Testo semplice, un URL per riga.

#### `GET /api/downloads/:id/logs` — recupera log di download

**Risposta:** `{ id, log: string }`

### Crea / elimina

#### `POST /api/downloads` — crea download in batch

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

**Risposta:** `DownloadTask[]`

#### `DELETE /api/downloads/:id` — elimina attività

**Risposta:** `{}`

### Modifica / stato

#### `PUT /api/downloads/:id` — modifica attività

**Body** (tutti i campi opzionali):

```json
{
  "name": "New name",
  "url": "New URL",
  "headers": "New headers",
  "folder": "New subdir"
}
```

#### `PUT /api/downloads/:id/live` — cambia flag live-stream

**Body:** `{ "isLive": true }`

#### `PUT /api/downloads/status` — aggiornamento stato batch

**Body:** `{ "ids": number[], "status": "waiting | downloading | success | failed | stopped" }`

### Avvio / stop

#### `POST /api/downloads/:id/start` — avvia download

**Body:**

```json
{
  "localPath": "/Users/me/Downloads/MediaGo",
  "deleteSegments": true
}
```

- `localPath`: dove salvare (percorso assoluto)
- `deleteSegments`: per download m3u8, se eliminare i segmenti `.ts` dopo il merge

#### `POST /api/downloads/:id/stop` — ferma download

**Risposta:** `{}`

## Valori enum

### Tipo download `type`

| Valore     | Note                                  |
| ---------- | ------------------------------------- |
| `m3u8`     | Stream HLS (tramite N_m3u8DL-RE)      |
| `bilibili` | Video Bilibili (tramite BBDown)       |
| `direct`   | Download HTTP diretto (tramite aria2) |
| `youtube`  | YouTube e 1000+ siti (tramite yt-dlp) |
| `mediago`  | Tipo interno MediaGo                  |

### Stato attività `status`

| Valore        | Note                 |
| ------------- | -------------------- |
| `waiting`     | In coda, non avviata |
| `downloading` | In corso             |
| `success`     | Completata           |
| `failed`      | Terminata con errore |
| `stopped`     | Fermata manualmente  |
