import type { DownloadType } from "@mediago/shared-common";

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
}

/** Reachability probe result for the configured MediaGo server. */
export interface ServerStatus {
  ok: boolean;
  /** Human-readable description, localised when possible. */
  message: string;
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
  | { type: "IMPORT_RESULT"; ok: boolean; count: number; error?: string }
  | { type: "OK" };
