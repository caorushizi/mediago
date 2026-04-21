import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  // `__MSG_*__` references are resolved by Chrome against
  // `public/_locales/<lang>/messages.json` at install time, picking the
  // entry matching the browser UI language (fallback: `default_locale`).
  // This handles surfaces the extension can't control (chrome://extensions,
  // toolbar tooltip). UI inside the popup / options is translated
  // separately with i18next so the user can override the choice.
  default_locale: "en",
  name: "__MSG_appName__",
  short_name: "MediaGo",
  description: "__MSG_appDescription__",
  version: pkg.version,
  icons: {
    "16": "public/icons/mediago-16.png",
    "32": "public/icons/mediago-32.png",
    "48": "public/icons/mediago-48.png",
    "128": "public/icons/mediago-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "__MSG_actionTitle__",
    default_icon: {
      "16": "public/icons/mediago-16.png",
      "32": "public/icons/mediago-32.png",
      "48": "public/icons/mediago-48.png",
      "128": "public/icons/mediago-128.png",
    },
  },
  options_ui: {
    page: "src/options/index.html",
    open_in_tab: true,
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["webRequest", "tabs", "storage"],
  host_permissions: ["<all_urls>"],
});
