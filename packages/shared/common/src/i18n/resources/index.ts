import { backendEn } from "./backend/en";
import { backendZh } from "./backend/zh";
import { frontendEn } from "./frontend/en";
import { frontendZh } from "./frontend/zh";

export const i18nResources = {
  backend: {
    en: backendEn,
    zh: backendZh,
  },
  frontend: {
    main: {
      en: frontendEn,
      zh: frontendZh,
    },
  },
} as const;

export type BackendLanguage = keyof typeof i18nResources.backend;
export type FrontendApp = keyof typeof i18nResources.frontend;
export type FrontendLanguage<App extends FrontendApp = FrontendApp> = keyof (typeof i18nResources.frontend)[App];

export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;
export const DEFAULT_BACKEND_NAMESPACE = "backend" as const;
export const DEFAULT_FRONTEND_APP = "main" as const;

export { backendEn, backendZh, frontendEn, frontendZh };
