import { defineManifest } from "@crxjs/vite-plugin";
// The extension version intentionally tracks the Desktop app version —
// they ship together, and users expect chrome://extensions to match the
// MediaGo window's "Current version" label. The single source of truth
// for the Desktop version is `apps/electron/app/package.json`, which
// `apps/electron/tsdown.config.ts` also reads (and exposes as
// `process.env.APP_VERSION` to the renderer). We piggyback on the same
// file here so bumping one version bumps both.
import desktopPkg from "../../apps/electron/app/package.json" with { type: "json" };

/**
 * Chrome's manifest `version` field only accepts 1-4 dot-separated
 * integers (`3.5.0`, `3.5.0.42`). SemVer suffixes like `-beta.2` or
 * `+build.7` are rejected at install time. Strip them for `version`
 * but keep the full string in `version_name`, which is a free-form
 * display label shown in chrome://extensions without participating in
 * update ordering.
 */
function toManifestVersion(v: string): string {
  return v.split(/[-+]/)[0];
}

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
  version: toManifestVersion(desktopPkg.version),
  version_name: desktopPkg.version,
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
