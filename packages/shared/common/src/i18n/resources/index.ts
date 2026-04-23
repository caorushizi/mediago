import { en } from "./en";
import { it } from "./it";
import { zh } from "./zh";

export const i18nResources = {
  en,
  it,
  zh,
} as const;

export const SUPPORTED_LANGUAGES = ["en", "it", "zh"] as const;
export const DEFAULT_BACKEND_NAMESPACE = "backend" as const;
export const DEFAULT_FRONTEND_APP = "main" as const;

export { en, it, zh };
