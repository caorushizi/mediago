import type { DownloadType } from "@mediago/shared-common";

/**
 * UI language choice persisted in extension settings.
 *
 * - `system` — follow the browser UI language (`chrome.i18n.getUILanguage()`).
 * - `zh` / `en` / `it` — hard-pinned.
 *
 * This maps 1:1 to the language radio on the options
 * page and is resolved to a concrete locale at i18n bootstrap time.
 */
export type ExtensionLanguage = "system" | "zh" | "en" | "it";

/**
 * Wire-format for localisable text produced in the service worker and
 * rendered in popup / options. The service worker has no i18n instance
 * of its own, so it emits `{ key, values? }` descriptors and the React
 * side calls `t(key, values)` to render. Using descriptors (rather than
 * pre-formatted strings) lets the UI re-render correctly when the user
 * switches language without round-tripping through the SW.
 */
export interface LocalizedMessage {
  key: string;
  values?: Record<string, string | number>;
}

/**
 * A sniffed resource attached to a browser tab.
 *
 * Shape matches what the popup renders and what the background forwards
 * to MediaGo's `POST /api/downloads`. Extra fields (e.g. size guess)
 * can be added later without touching the network contract.
 */
export interface DetectedSource {
  /** Stable per-tab id, generated in the background. */
  id: string;
  /** Download URL (the actual media stream). */
  url: string;
  /** Page URL where the request originated. */
  documentURL: string;
  /** Page title at sniff time, used as the default filename. */
  name: string;
  /** Which MediaGo downloader should handle this source. */
  type: DownloadType;
  /** Serialised request headers (JSON) for replay by the downloader. */
  headers?: string;
  /** Wall-clock time of detection (ms since epoch). */
  detectedAt: number;
}

/**
 * Which delivery mechanism the extension uses to hand captured sources
 * over to MediaGo. Explicitly chosen by the user — no auto-detection,
 * no silent fallback.
 *
 * - `desktop-schema`  →  navigate via MediaGo's existing renderer-route
 *                        deeplink (`mediago-community://index.html/?n=1&…`)
 *                        so the locally-installed MediaGo Desktop app
 *                        receives the task through its `useUrlInvoke`
 *                        hook. No URL / apiKey needed.
 * - `desktop-http`    →  POST `http://127.0.0.1:9900/api/downloads`
 *                        against the Go Core embedded in a running
 *                        Desktop process. No apiKey (Desktop doesn't
 *                        enable auth by default).
 * - `docker-http`     →  POST to a user-configured server URL with an
 *                        `X-API-Key` header. Used for self-hosted
 *                        Docker deployments.
 */
export type InvocationMode = "desktop-schema" | "desktop-http" | "docker-http";

/**
 * Persisted user settings. Stored in `chrome.storage.local`.
 *
 * Fields beyond `mode` are only meaningful for specific modes:
 * - `serverUrl` / `apiKey` — docker-http only
 * The UI hides irrelevant fields based on `mode`.
 */
export interface ExtensionSettings {
  mode: InvocationMode;
  /** For `docker-http` only. Full URL without trailing slash. */
  serverUrl: string;
  /** For `docker-http` only, when the server runs with `--enable-auth`. */
  apiKey: string;
  /**
   * Whether to start downloading immediately after the task lands on
   * MediaGo, or just append it to the list for the user to start
   * manually. Applies to **both** modes:
   * - HTTP: sent as `startDownload` in the POST body.
   * - Schema: encoded as `downloadNow=1` in the deeplink URL.
   */
  downloadNow: boolean;
  /**
   * Schema-only knob. When `true` (default), the deeplink carries
   * `silent=1` so MediaGo adds the task without prompting. When
   * `false`, MediaGo Desktop opens its download form dialog prefilled
   * with the sniffed values so the user can tweak name / folder /
   * type before committing.
   *
   * Has no effect in HTTP modes — HTTP imports are always silent
   * because there's no interactive UI in that path.
   */
  schemaSilent: boolean;
  /**
   * UI language for popup / options. Defaults to `"system"`, matching
   * the behaviour of the main app (`apps/ui`'s AppStore.language).
   */
  language: ExtensionLanguage;
}

/** Reachability probe result for the configured MediaGo server. */
export interface ServerStatus {
  ok: boolean;
  /**
   * Either a translation descriptor (for wording owned by the extension,
   * e.g. "schema invoked, please verify Desktop launched") or a raw
   * string when the value comes from the server / network stack and has
   * no canonical translation (HTTP status text, OS error messages).
   */
  message: LocalizedMessage | string;
  /** HTTP status if the probe reached the server. */
  status?: number;
}

/* -------------------------------------------------------------------- */
/* Messages exchanged between popup / options and the service worker.   */
/* Keeping them in one file prevents drift between sender and receiver. */
/* -------------------------------------------------------------------- */

export type ExtensionMessage =
  | { type: "GET_SOURCES"; tabId: number }
  | { type: "CLEAR_SOURCES"; tabId: number }
  | { type: "IMPORT_SOURCES"; sources: DetectedSource[] }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: ExtensionSettings }
  | {
      type: "TEST_CONNECTION";
      mode: InvocationMode;
      serverUrl: string;
      apiKey: string;
    };

export type ExtensionResponse =
  | { type: "SOURCES"; sources: DetectedSource[] }
  | { type: "SETTINGS"; settings: ExtensionSettings }
  | { type: "STATUS"; status: ServerStatus }
  | {
      type: "IMPORT_RESULT";
      ok: boolean;
      count: number;
      error?: LocalizedMessage | string;
    }
  | { type: "OK" };
