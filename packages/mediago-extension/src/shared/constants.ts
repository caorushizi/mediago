import type { ExtensionSettings } from "./types";

/**
 * Desktop Go Core listen address in `desktop-http` mode.
 *
 * `39719` matches the Electron main process's hard-coded `preferredPort`
 * in `apps/electron/src/services/downloader.server.ts`. NOT the `9900`
 * used by Go Core in standalone web/server mode — those are two
 * different deployment shapes that happen to share the same binary.
 */
export const DESKTOP_HTTP_BASE = "http://127.0.0.1:39719";

/**
 * Custom scheme used by MediaGo Desktop. Sourced from the repo root
 * `.env` (`APP_NAME=…`) via `vite.config.ts`'s `define` — so rebranding
 * the Desktop build only requires editing the single `.env` and
 * rebuilding; extension and Electron stay in sync automatically.
 *
 * Matches the Electron side (`apps/electron/src/constants/index.ts`
 * → `defaultScheme = process.env.APP_NAME`).
 */
export const MEDIAGO_SCHEME: string =
  import.meta.env.APP_NAME || "mediago-community";

/**
 * Default mode on first install: local Desktop via HTTP (silent, no
 * prompt). Import-behaviour knobs default to the least-surprising
 * choices: don't auto-start (user gets to review the queue first) and
 * don't re-prompt on schema (one-click is the entire point of the
 * extension).
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  mode: "desktop-http",
  serverUrl: "",
  apiKey: "",
  downloadNow: false,
  schemaSilent: true,
  language: "system",
};

/** localStorage keys in `chrome.storage.local`. */
export const STORAGE_KEY_SETTINGS = "mediago.settings";

/**
 * Per-tab session storage. Stored in `chrome.storage.session` so that
 * closing the tab or restarting the browser clears captured sources.
 */
export const storageKeyTab = (tabId: number) => `mediago.tab.${tabId}`;
