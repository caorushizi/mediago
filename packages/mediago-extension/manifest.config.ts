import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "MediaGo 资源检测",
  short_name: "MediaGo",
  description:
    "Detect downloadable video / audio URLs on any page and send them to your MediaGo server in one click.",
  version: pkg.version,
  icons: {
    "16": "public/icons/mediago-16.png",
    "32": "public/icons/mediago-32.png",
    "48": "public/icons/mediago-48.png",
    "128": "public/icons/mediago-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "MediaGo 资源检测",
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
