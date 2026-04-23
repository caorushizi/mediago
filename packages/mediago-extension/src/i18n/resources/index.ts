import en from "./en";
import it from "./it";
import zh from "./zh";

export { type ExtensionResources } from "./zh";

export const resources = {
  en: { translation: en },
  it: { translation: it },
  zh: { translation: zh },
} as const;

export type SupportedLanguage = keyof typeof resources;
