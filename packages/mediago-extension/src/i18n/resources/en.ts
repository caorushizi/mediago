import type { ExtensionResources } from "./zh";

const resource: ExtensionResources = {
  popup: {
    header: "MediaGo Sniffer",
    clear: "Clear",
    importAll: "Import all",
    importAllWithCount: "Import all ({{count}})",
    settings: "Settings",
    imported: "Imported {{count}} task(s)",
    importFailed: "Import failed",
  },
  status: {
    detecting: "Detecting",
    schemaMode: "Schema mode",
    notConfigured: "Not configured",
    connectionFailed: "Connection failed",
  },
  empty: {
    title: "No downloadable resources detected on this page yet.",
    hint: "Matching sources show up here automatically as you browse.",
  },
  source: {
    unnamed: "(untitled)",
    import: "Import",
  },
  options: {
    pageTitle: "MediaGo Extension Settings",
    language: {
      title: "Interface Language",
      description:
        'Language used by the popup and options page. "Follow system" picks based on the browser UI language.',
      system: "Follow system",
      zh: "中文",
      en: "English",
    },
    server: {
      title: "Dispatch Mode",
      description:
        "The extension never silently falls back. Once a mode is chosen, any failure is reported as-is — switch modes manually on this page if you need to.",
      modeSchemaTitle: "Desktop · Schema protocol",
      modeSchemaDesc:
        "Hand off via the mediago-community:// protocol (launches Desktop if it isn't running). Requires the MediaGo Desktop app installed locally.",
      modeDesktopHttpTitle: "Desktop · HTTP local",
      modeDesktopHttpDesc:
        "Talk to a running Desktop through {{base}}. Requires Desktop to be running, but no confirmation dialog.",
      modeDockerHttpTitle: "Docker / Self-hosted · HTTP",
      modeDockerHttpDesc:
        "Connect to a remote Docker deployment or any self-hosted MediaGo server. Requires a server URL; add an API Key when auth is enabled.",
      serverUrlLabel: "Server URL",
      serverUrlPlaceholder: "http://your-host:8899",
      apiKeyLabel: "API Key",
      apiKeyOptional: "(optional)",
      apiKeyPlaceholder: "Leave blank to skip the X-API-Key header",
      schemaNoteLead: "Uses MediaGo's existing",
      schemaNoteMid:
        'renderer route protocol to invoke Desktop. The active tab is navigated to the protocol URL (same pattern as cat-catch). Chrome shows an "Open MediaGo-community?" dialog the first time — tap',
      schemaAllow: "Allow",
      schemaAlways: "Always allow",
      schemaAfter: "to make subsequent hand-offs silent.",
      limitationLabel: "Limitation",
      limitationBody:
        "Schema only dispatches one task at a time — use HTTP mode for batch imports.",
      desktopHttpNoteLead: "Always connects to",
      desktopHttpNoteTail:
        ' — Desktop listens automatically on startup; use "Test connection" to verify it\'s online.',
    },
    importBehaviour: {
      title: "Import Behaviour",
      descriptionLead: "These toggles ride on the deeplink query string (",
      descriptionMid: ") or the HTTP body (",
      descriptionTail: ") and tell MediaGo what to do with the incoming task.",
      downloadNowLabel: "Start downloading immediately",
      downloadNowDesc:
        "On: the task is queued AND started. Off: it's only added to the list, waiting for the user to start it. Applies to both Schema and HTTP modes.",
      schemaSilentLabel: "Silent import (Schema mode)",
      schemaSilentActive:
        "On: the deeplink carries silent=1 so MediaGo creates the task immediately. Off: MediaGo opens its download form prefilled with the sniffed name / type / folder for review.",
      schemaSilentInactive:
        "Only takes effect in Schema mode — HTTP mode has no dialog concept and is always silent.",
    },
    rules: {
      title: "Sniffing Rules",
      descriptionLead: "Rules are maintained centrally in",
      descriptionTail: "and shared between Desktop and the browser extension.",
      m3u8Label: "HLS / m3u8 streams",
      directLabel: "Direct media files",
      bilibiliLabel: "Bilibili video pages",
      youtubeLabel: "YouTube",
    },
  },
  common: {
    save: "Save",
    saved: "Saved",
    saveFailed: "Failed to save",
    testConnection: "Test connection",
  },
  errors: {
    serverUrlRequired: "Please fill in the server URL first",
    dockerServerRequired: "Docker mode requires a server URL",
    schemaBatchNotSupported:
      "Schema mode can only dispatch one task at a time; switch to HTTP mode (Options page) for batch imports.",
    schemaNoActiveTab:
      "No active tab in the current window — cannot invoke the protocol",
    schemaInvoked:
      "Invoked mediago-community:// — if the Desktop window didn't appear, make sure MediaGo Desktop is installed.",
    serverNotConfigured: "MediaGo server not configured",
    dockerNotConfigured:
      "Docker mode has no server URL yet — please configure one on the options page.",
    unknown: "{{detail}}",
  },
};

export default resource;
