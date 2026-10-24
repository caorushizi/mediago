---
layout: doc
outline: deep
---

# Informativa sulla privacy

Aggiornata il 24 ottobre 2026. Contatto: [84996057@qq.com](mailto:84996057@qq.com).

Questa informativa riguarda MediaGo desktop e l’interfaccia Web/Docker. I controlli descritti valgono per le versioni che li includono; le versioni precedenti possono comportarsi diversamente. Il gestore di un server autonomo controlla i propri dati e la configurazione delle statistiche.

## Download e dati locali

MediaGo usa URL, intestazioni e credenziali facoltative forniti dall’utente per scaricare o analizzare risorse. Le richieste raggiungono siti, server multimediali, proxy e strumenti coinvolti, compresi i server della rete locale scelti dall’utente. Questi destinatari possono vedere l’indirizzo IP. Disattivare le statistiche non blocca download, pagine o controlli degli aggiornamenti richiesti.

File, cronologia, preferiti, impostazioni, archivi del browser e log restano sul computer o sul server configurato. I log possono contenere URL, percorsi e dettagli degli errori: verifica e oscura i dati prima di condividerli. L’interfaccia degli eventi statistici non invia automaticamente questi archivi al manutentore. I siti nel browser integrato applicano le proprie regole e i propri cookie.

## TalkingData facoltativo

L’integrazione JavaScript/H5 di TalkingData, di Beijing Tendcloud Technology Co., Ltd., viene caricata solo se la build ha un identificatore configurato **e l’utente acconsente**. Una scelta assente, illeggibile o una build senza identificatore mantengono le statistiche disattivate.

MediaGo invia nomi di eventi di utilizzo, ad esempio navigazione, azioni di download, conversione e aggiornamento. Non aggiunge ID macchina/attività, URL delle risorse, nomi file, password, API key o parametri arbitrari. La richiesta dello script contiene identificatore dell’app e versione.

Lo script del fornitore può elaborare IP, caratteristiche del browser/sistema, lingua, contesto della pagina, tempi di sessione e identificatori nei cookie o nell’archivio del browser. L’assenza dell’ID macchina di MediaGo non rende necessariamente anonimi i dati. Consulta l’[informativa SDK](https://www.talkingdata.com/sdkprivacy.jsp?languagetype=en_us) e l’[informativa TalkingData](https://www.talkingdata.com/privacy.jsp?languagetype=en_us). Gli elenchi di permessi degli SDK mobili non descrivono automaticamente questa integrazione desktop/Web.

Lo scopo è comprendere l’uso delle funzioni e migliorare il prodotto. Rifiutare non limita i download; il contenuto scaricato non viene aggiunto agli eventi o venduto tramite questa interfaccia.

## Consenso e revoca

- L’installer Windows interattivo lascia la casella disattivata alla prima installazione e mostra la scelta già salvata per l’account corrente, se disponibile. Installazioni silenziose e aggiornamenti automatici non creano o sostituiscono il consenso.
- Versioni portatili, macOS/Linux e installazioni senza scelta mostrano un avviso: puoi consentire o continuare senza statistiche. Prima della scelta l’SDK non viene caricato.
- In **Impostazioni → Impostazioni di base → Condividi statistiche di utilizzo** puoi cambiare scelta. La disattivazione ricarica l’interfaccia per fermare i timer dell’SDK; i download Core proseguono. Richieste già inviate non possono essere ritirate.
- Nel Web/Docker la scelta appartiene al browser e al sito corrente, non a tutti gli utenti del server. Cancellare i dati del sito ripristina lo stato disattivato fino a un nuovo consenso.
- Un errore di salvataggio viene segnalato; non viene dichiarata salvata una nuova scelta.

Sul desktop la preferenza è nel file `MediaGo/analytics-consent` della cartella dati applicazioni dell’utente (`%APPDATA%\MediaGo\analytics-consent` su Windows); nel Web usa la chiave locale `mediago.analytics-consent.v1`.

## Conservazione, destinatari e diritti

I dati locali restano finché li elimini tramite l’app o dalla cartella dati del computer/server. Eliminare un’attività non elimina necessariamente un file scaricato o esportato. La preferenza di rifiuto viene conservata.

TalkingData elabora le statistiche abilitate. Tempi di conservazione e luoghi di trattamento dipendono dalla sua informativa e dalle impostazioni dell’account del servizio: il client non può determinare o imporre un periodo o un paese specifico. Non promettiamo scadenze o ubicazioni non verificate. La revoca impedisce nuovi caricamenti dopo la ricarica; non cancella automaticamente dati già ricevuti dal fornitore o ogni archivio del browser creato in precedenza.

Per accesso, rettifica, cancellazione o domande scrivi a **84996057@qq.com**, indicando versione, periodo approssimativo e tipo di richiesta, senza password, cookie, API key o log integrali. Il manutentore valuterà la richiesta e coinvolgerà il fornitore quando necessario. Per un server autonomo contatta anche il suo gestore. Restano disponibili i diritti previsti dalla legge applicabile.

## Sito e altri servizi

Il sito di documentazione è separato: la configurazione di produzione include Baidu Analytics e Google Analytics. Commenti o collegamenti possono contattare GitHub e altri servizi scelti. L’interruttore dell’app non controlla tali siti esterni. Consulta le informative di [Google](https://policies.google.com/privacy) e [Baidu](https://privacy.baidu.com/policy).

La politica verrà aggiornata se cambiano finalità o ambito. Lo stato delle firme è nella [Code signing policy](./code-signing.md).
