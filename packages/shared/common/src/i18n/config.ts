export const DEFAULT_FALLBACK_LNG = "zh";
export const BASE_I18N_OPTIONS = {
  fallbackLng: DEFAULT_FALLBACK_LNG,
  interpolation: {
    escapeValue: false,
  },
} as const;

/**
 * Resolve a stored AppStore.language value to a real i18n key ("zh" | "en").
 *
 * The persisted language may be `"system"` (meta value meaning "follow OS locale").
 * Each process resolves it at apply-time by passing its own locale source:
 *   - Renderer: navigator.language
 *   - Electron main: app.getLocale()
 *
 * Pure function — callers are responsible for reading the raw locale.
 */
export function resolveAppLanguage(
  language: string | undefined,
  systemLocale: string | undefined,
): "zh" | "en" {
  if (language === "zh" || language === "en") {
    return language;
  }
  return (systemLocale ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
}
