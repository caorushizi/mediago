import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import manifest from "./manifest.config";

export default defineConfig(({ mode }) => {
  // MediaGo stores brand-level config (APP_NAME, APP_ID, …) in the repo
  // root `.env`. Vite only auto-loads `.env` from the current package
  // dir, so pull the root file explicitly and re-inject the one field
  // the extension needs. Same pattern as apps/electron/tsdown.config.ts
  // (which does `process.env.APP_NAME = ...`) so the custom protocol
  // scheme stays consistent between the Desktop build and the extension.
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");

  return {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    // Order matters: react first to transform JSX, tailwindcss second to
    // scan the transformed output, crx last so it bundles the result into
    // the extension shape (manifest + web_accessible_resources + SW).
    plugins: [react(), tailwindcss(), crx({ manifest })],
    define: {
      "import.meta.env.APP_NAME": JSON.stringify(
        rootEnv.APP_NAME ?? "mediago-community",
      ),
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
