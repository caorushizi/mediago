import type { i18n } from "i18next";

import { DEFAULT_SETTINGS, STORAGE_KEY_SETTINGS } from "@/shared/constants";
import type { ExtensionLanguage, ExtensionSettings } from "@/shared/types";

import { createExtensionI18n, resolveLanguage } from "./index";

/**
 * Bootstrap an i18next instance for a popup / options page:
 *
 * 1. Read the persisted language from `chrome.storage.local`.
 * 2. Resolve `system` → concrete locale using the browser UI language.
 * 3. Build and return the i18n instance.
 * 4. Subscribe to storage changes so the page re-renders when the user
 *    picks a different language from the LanguageCard — no reload.
 *
 * Both entry points (popup / options) run this identically; sharing here
 * keeps the behaviour aligned.
 */
export async function bootstrapExtensionI18n(): Promise<i18n> {
  const raw = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  const stored = (raw[STORAGE_KEY_SETTINGS] ??
    {}) as Partial<ExtensionSettings>;
  const setting: ExtensionLanguage =
    stored.language ?? DEFAULT_SETTINGS.language;
  const instance = createExtensionI18n(resolveLanguage(setting));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[STORAGE_KEY_SETTINGS];
    if (!change) return;
    const nextSettings = (change.newValue ?? {}) as Partial<ExtensionSettings>;
    const next = nextSettings.language ?? DEFAULT_SETTINGS.language;
    const resolved = resolveLanguage(next);
    if (instance.language !== resolved) {
      void instance.changeLanguage(resolved);
    }
  });

  return instance;
}
