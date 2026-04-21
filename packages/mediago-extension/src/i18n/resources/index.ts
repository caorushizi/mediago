import en from "./en";
import zh from "./zh";

export { type ExtensionResources } from "./zh";

export const resources = {
  en: { translation: en },
  zh: { translation: zh },
} as const;

export type SupportedLanguage = keyof typeof resources;
