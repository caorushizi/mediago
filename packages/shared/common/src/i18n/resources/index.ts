import { en } from "./en";
import { zh } from "./zh";
import { it } from "./it";

export const i18nResources = {
  en,
  zh,
  it,
} as const;

export const SUPPORTED_LANGUAGES = ["en", "zh", "it"] as const;
export const DEFAULT_BACKEND_NAMESPACE = "backend" as const;
export const DEFAULT_FRONTEND_APP = "main" as const;

export { en, zh, it };
