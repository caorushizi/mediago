export const DEFAULT_FALLBACK_LNG = "zh";
export const BASE_I18N_OPTIONS = {
  fallbackLng: DEFAULT_FALLBACK_LNG,
  interpolation: {
    escapeValue: false,
  },
} as const;

export type ResolvedAppLanguage = "zh" | "en" | "it";

/**
 * Resolve a stored AppStore.language value to a real i18n key.
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
): ResolvedAppLanguage {
  if (language === "zh" || language === "en" || language === "it") {
    return language;
  }

  const normalizedSystemLocale = (systemLocale ?? "").toLowerCase();
  if (normalizedSystemLocale.startsWith("zh")) {
    return "zh";
  }
  if (normalizedSystemLocale.startsWith("it")) {
    return "it";
  }
  return "en";
}
