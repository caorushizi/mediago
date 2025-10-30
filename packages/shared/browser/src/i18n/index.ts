import {
  BASE_I18N_OPTIONS,
  i18nResources,
  SUPPORTED_LANGUAGES,
} from "@mediago/shared-common";
import { createInstance, i18n, type InitOptions, type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export interface BrowserResourceOptions {
  includeBackend?: boolean;
}

export interface CreateBrowserI18nOptions extends BrowserResourceOptions {
  debug?: boolean;
}

const buildTranslationBundle = (
  language: (typeof SUPPORTED_LANGUAGES)[number],
) => {
  const translation: Record<string, string> = { ...i18nResources[language] };

  Object.assign(translation, i18nResources[language]);

  return translation;
};

export const buildBrowserResources = (): Resource => {
  return SUPPORTED_LANGUAGES.reduce<Resource>((acc, language) => {
    acc[language] = {
      translation: buildTranslationBundle(language),
    };

    return acc;
  }, {} as Resource);
};

export function createBrowserI18n({
  debug = false,
}: CreateBrowserI18nOptions = {}): i18n {
  const instance = createInstance();

  instance.use(LanguageDetector).use(initReactI18next);

  const resources = buildBrowserResources();

  void instance.init({
    ...BASE_I18N_OPTIONS,
    debug,
    resources,
  } satisfies InitOptions);

  return instance;
}
