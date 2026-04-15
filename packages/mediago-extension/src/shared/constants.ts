import type { ExtensionSettings } from "./types";

/** Desktop Go Core default listen address. Hard-coded in desktop-http mode. */
export const DESKTOP_HTTP_BASE = "http://127.0.0.1:9900";

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

/** Default mode on first install: local Desktop via HTTP (silent, no prompt). */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  mode: "desktop-http",
  serverUrl: "",
  apiKey: "",
};

/** localStorage keys in `chrome.storage.local`. */
export const STORAGE_KEY_SETTINGS = "mediago.settings";

/**
 * Per-tab session storage. Stored in `chrome.storage.session` so that
 * closing the tab or restarting the browser clears captured sources.
 */
export const storageKeyTab = (tabId: number) => `mediago.tab.${tabId}`;
