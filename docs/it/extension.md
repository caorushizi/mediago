---
layout: doc
outline: deep
---

# Estensione browser

MediaGo include una leggera estensione browser Manifest V3 che rileva URL video / audio scaricabili su qualsiasi sito e li invia a MediaGo con un clic.

## Cosa fa

- Rileva stream HLS / m3u8 e file multimediali diretti `.mp4` / `.flv` / `.mov` in ogni pagina visitata
- Riconosce pagine video Bilibili e URL YouTube video / short / live / embed
- Mostra il numero di risorse rilevate nel badge dell'icona della toolbar
- Importa una singola sorgente o tutte le sorgenti in MediaGo con un clic (desktop o self-hosted)

## Installazione

L'estensione non è ancora su Chrome Web Store, quindi deve essere caricata come "estensione non pacchettizzata". L'installer di MediaGo Desktop la include già: non devi scaricarla separatamente.

1. Apri MediaGo Desktop
2. Vai in **Impostazioni → Altre impostazioni → Directory estensione browser** e clicca il pulsante per aprire la cartella dell'estensione
3. In Chrome / Edge, visita `chrome://extensions/`
4. Attiva **Modalità sviluppatore** in alto a destra
5. Clicca **Carica estensione non pacchettizzata** e seleziona la cartella aperta al punto 2
6. Dovresti vedere l'icona dell'estensione nella toolbar: fissala per accedervi più facilmente

## Modalità di invio

Clicca l'icona ingranaggio nel popup per aprire la pagina opzioni, poi scegli una modalità:

| Modalità                            | Quando usarla                                                                 | Richiede                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Desktop · Protocollo schema**     | MediaGo Desktop installato localmente; il browser può passare link protocollo | Nessuna configurazione; la prima chiamata mostra "Aprire MediaGo?" — spunta "Consenti sempre" per l'invio silenzioso successivo |
| **Desktop · HTTP locale** (default) | MediaGo Desktop installato e in esecuzione                                    | Nessuna configurazione; l'estensione si connette a `127.0.0.1:39719`                                                            |
| **Docker / Self-hosted · HTTP**     | Connessione a un server MediaGo remoto, ad esempio Docker                     | URL server richiesto; API Key se il server è avviato con `--enable-auth`                                                        |

> **L'estensione non effettua mai fallback silenziosi.** Una volta scelta una modalità, qualsiasi errore viene mostrato così com'è: cambia modalità manualmente nella pagina opzioni se necessario.

## Comportamento di importazione

Due toggle nella pagina opzioni sotto **Comportamento importazione**:

- **Avvia download subito** — On: l'attività viene messa in coda e avviata. Off: viene solo aggiunta alla lista, in attesa dell'avvio manuale. Vale per Schema e HTTP.
- **Importazione silenziosa (modalità Schema)** — On: il deeplink include `silent=1` e MediaGo crea subito l'attività. Off: MediaGo apre il modulo download precompilato con nome / tipo / cartella rilevati per la revisione. Vale solo in modalità Schema; HTTP è sempre silenzioso.

## Lingua interfaccia

L'estensione supporta cinese, inglese e italiano. Per impostazione predefinita segue la lingua UI del browser. Puoi forzare la scelta nella pagina opzioni sotto **Lingua interfaccia**: Segui sistema / 中文 / English / Italiano.

## Risoluzione problemi

### Il pulsante "Directory estensione browser" non fa nulla

- **Sviluppo**: esegui prima `pnpm -F @mediago/extension build` per generare la dist
- **Produzione**: reinstalla MediaGo: la cartella `resources/extension/` dovrebbe esistere nella directory di installazione dell'app

### Il test connessione Desktop · HTTP fallisce

- Verifica che MediaGo Desktop sia in esecuzione
- Verifica che la porta `39719` non sia occupata da un altro processo (`netstat -ano | findstr 39719` su Windows)
- Se esegui anche MediaGo in modalità web/server locale, nota che Go Core standalone usa `9900`, non `39719`

### La modalità Schema chiede conferma ogni volta

Al primo passaggio Chrome mostra "Aprire MediaGo-community?": spunta **Consenti sempre**. Le chiamate successive saranno silenziose.

### La modalità Schema fallisce con l'importazione batch

Schema invia una sola attività per chiamata: è una limitazione fondamentale dei protocolli di hand-off. Passa alla modalità HTTP (Desktop o Docker) per importazioni batch.
