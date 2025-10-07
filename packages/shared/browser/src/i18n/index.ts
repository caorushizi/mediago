import { createInstance, type InitOptions, type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import {
  BASE_I18N_OPTIONS,
  DEFAULT_FRONTEND_APP,
  SUPPORTED_LANGUAGES,
  type FrontendApp,
  i18nResources,
} from "@mediago/shared-common";

export interface BrowserResourceOptions {
  includeBackend?: boolean;
}

export interface CreateBrowserI18nOptions extends BrowserResourceOptions {
  debug?: boolean;
}

const buildTranslationBundle = (
  language: (typeof SUPPORTED_LANGUAGES)[number],
  app: FrontendApp,
  { includeBackend = true }: BrowserResourceOptions,
) => {
  const translation: Record<string, string> = includeBackend
    ? { ...i18nResources.backend[language] }
    : {};

  Object.assign(translation, i18nResources.frontend[app][language]);

  return translation;
};

export const buildBrowserResources = (
  app: FrontendApp = DEFAULT_FRONTEND_APP,
  options: BrowserResourceOptions = {},
): Resource => {
  return SUPPORTED_LANGUAGES.reduce<Resource>((acc, language) => {
    acc[language] = {
      translation: buildTranslationBundle(language, app, options),
    };

    return acc;
  }, {} as Resource);
};

export const createBrowserI18n = (
  app: FrontendApp = DEFAULT_FRONTEND_APP,
  { debug = false, includeBackend = true }: CreateBrowserI18nOptions = {},
) => {
  const instance = createInstance();

  instance.use(LanguageDetector).use(initReactI18next);

  const resources = buildBrowserResources(app, { includeBackend });

  void instance.init({
    ...BASE_I18N_OPTIONS,
    debug,
    resources,
  } satisfies InitOptions);

  return instance;
};
