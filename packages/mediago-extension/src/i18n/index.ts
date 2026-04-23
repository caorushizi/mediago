import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, type SupportedLanguage } from "./resources";

export type ExtensionLanguage = "system" | SupportedLanguage;

/**
 * Reduce the persisted `language` setting to a concrete resource key.
 *
 * `system` means "follow the browser". `chrome.i18n.getUILanguage()` is
 * available in both extension pages and service workers, and — unlike
 * `navigator.language` — it reports the Chrome UI language rather than
 * whatever the active page advertises. Fall back to `navigator.language`
 * if somehow unavailable (non-Chrome hosts, tests).
 */
export function resolveLanguage(
  setting: ExtensionLanguage | undefined,
): SupportedLanguage {
  if (setting === "zh" || setting === "en" || setting === "it") return setting;
  const uiLang =
    (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.()) ||
    (typeof navigator !== "undefined" ? navigator.language : "") ||
    "";
  const normalizedUiLang = uiLang.toLowerCase();
  if (normalizedUiLang.startsWith("zh")) return "zh";
  if (normalizedUiLang.startsWith("it")) return "it";
  return "en";
}

/**
 * Build a fresh i18next instance wired to React. Each extension page
 * (popup, options) owns its own instance — they live in separate
 * JS realms anyway, so there's nothing to share.
 */
export function createExtensionI18n(initialLng: SupportedLanguage): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: initialLng,
    fallbackLng: "en",
    resources,
    interpolation: { escapeValue: false },
    // React already escapes; keep newlines as-is for our multi-line copy.
    returnNull: false,
  });
  return instance;
}

export { resources } from "./resources";
export type { SupportedLanguage } from "./resources";
