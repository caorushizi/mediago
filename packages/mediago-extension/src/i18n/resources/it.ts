import type { ExtensionResources } from "./zh";

const resource: ExtensionResources = {
  popup: {
    header: "Sniffer MediaGo",
    clear: "Azzera",
    importAll: "Importa tutto",
    importAllWithCount: "Importa tutto ({{count}})",
    settings: "Impostazioni",
    imported: "Importate {{count}} attività",
    importFailed: "Importazione fallita",
  },
  status: {
    detecting: "Rilevamento",
    schemaMode: "Modo schema",
    notConfigured: "Non configurato",
    connectionFailed: "Connessione fallita",
  },
  empty: {
    title: "Nessuna risorsa scaricabile rilevata in questa pagina.",
    hint: "Durante la navigazione le sorgenti corrispondenti vengono visualizzate automaticamente qui.",
  },
  source: {
    unnamed: "(senza titolo)",
    import: "Importa",
  },
  options: {
    pageTitle: "Impostazioni estensione MediaGo",
    language: {
      title: "Lingua interfaccia",
      description:
        `Lingua usata dal popup e dalla pagina delle opzioni. Scelte "Usa stessa lingua sistema" in base alla lingua dell'interfaccia utente del browser.`,
      system: "Usa stessa lingua sistema",
      zh: "中文",
      en: "English",
      it: "Italiano",
    },
    server: {
      title: "Modalità spedizione",
      description:
        "L'estensione non fallisce mai silenziosamente. Una volta scelta una modalità, qualsiasi errore viene segnalato così com'è: se necessario cambia modalità manualmente in questa pagina.",
      modeSchemaTitle: "Desktop · Protocollo schema",
      modeSchemaDesc:
        "Passa tramite il protocollo mediago-community:// (avvia desktop se non è in esecuzione). Richiede l'installazione locale dell'app MediaGo Desktop.",
      modeDesktopHttpTitle: "Desktop · HTTP locale",
      modeDesktopHttpDesc:
        "Parla con l'app desktop in esecuzione tramite {{base}}. Richiede che l'app desktop sia in esecuzione, ma non c'è nessuna finestra di conferma.",
      modeDockerHttpTitle: "Docker / HTTP self-hosted",
      modeDockerHttpDesc:
        "Connettiti ad una distribuzione Docker remota o a qualsiasi server MediaGo self-hosted. Richiede una URL del server; quando l'autenticazione è abilitata aggiungi una chiave API.",
      serverUrlLabel: "URL server",
      serverUrlPlaceholder: "http://your-host:8899",
      apiKeyLabel: "Chiave API",
      apiKeyOptional: "(opzionale)",
      apiKeyPlaceholder: "Lascia vuoto per saltare l'intestazione X-API-Key",
      schemaNoteLead: "Usa MediaGo esistente",
      schemaNoteMid:
        "Protocollo di instradamento del renderer per richiamare Desktop. La scheda attiva viene indirizzata all'URL del protocollo (stesso schema di cat-catch). Chrome visualizza la prima volta una finestra di dialogo 'Apri MediaGo-community?'",
      schemaAllow: "Consenti",
      schemaAlways: "Consenti sempre",
      schemaAfter: "per rendere silenziosi i successivi passaggi di consegna.",
      limitationLabel: "Limitazione",
      limitationBody:
        "Lo schema invia solo un'attività alla volta: per le importazioni batch usa la modalità HTTP.",
      desktopHttpNoteLead: "Collegati sempre a",
      desktopHttpNoteTail:
        "Il desktop ascolta automaticamente all'avvio; per verificare che sia online usa 'Verifica connessione'.",
    },
    importBehaviour: {
      title: "Comportamento importazione",
      descriptionLead: "Questi switch si basano sulla stringa di query del collegamento diretto (",
      descriptionMid: ") o dal corpo HTTP (",
      descriptionTail: ") e dicono a MediaGo cosa fare con l'attività in arrivo.",
      downloadNowLabel: "Avvia immediatamente download",
      downloadNowDesc:
        "ON: l'attività è in coda e AVVIATA. OFF: viene solo aggiunta all'elenco, in attesa che l'utente la avvii. Si applica sia alla modalità Schema che a quella HTTP.",
      schemaSilentLabel: "Importazione silenziosa (modalità schema)",
      schemaSilentActive:
        "ON: il deeplink porta silent=1 quindi MediaGo crea immediatamente l'attività. OFF: MediaGo apre il modulo di download precompilato con il nome/tipo/cartella sniffata per la revisione.",
      schemaSilentInactive:
        "Ha effetto solo in modalità sSchema: la modalità HTTP non prevede il concetto di dialogo ed è sempre silenziosa.",
    },
    rules: {
      title: "Regole sniffing",
      descriptionLead: "Le regole vengono mantenute centralmente in",
      descriptionTail: "e condivise tra app desktop e l'estensione del browser.",
      m3u8Label: "Stream HLS/m3u8",
      directLabel: "File multimediali diretti",
      bilibiliLabel: "Pagine video Bilibili",
      youtubeLabel: "YouTube",
    },
  },
  common: {
    save: "Salva",
    saved: "Salvato",
    saveFailed: "Impossibile salvare",
    testConnection: "Test connessione",
  },
  errors: {
    serverUrlRequired: "Prima inserisci l'URL del server",
    dockerServerRequired: "La modalità Docker richiede una URL del server",
    schemaBatchNotSupported:
      "La modalità schema può inviare solo un'attività alla volta. Per le importazioni batch passa alla modalità HTTP (pagina Opzioni).",
    schemaNoActiveTab:
      "Nessuna scheda attiva nella finestra attuale: impossibile richiamare il protocollo",
    schemaInvoked:
      "Invocato mediago-community://: se la finestra desktop non viene visualizzata, assicurati che MediaGo Desktop sia installato.",
    serverNotConfigured: "Server MediaGo non configurato",
    dockerNotConfigured:
      "La modalità Docker non ha ancora un URL del server- configura il server nella pagina delle opzioni.",
    unknown: "{{detail}}",
  },
};

export default resource;
