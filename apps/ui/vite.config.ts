import fs from "node:fs/promises";
import path from "node:path";
import { loadProfileEnv } from "@mediago/tooling/env";
import {
  createDependencyChunks,
  mediaGoBuildMetadataPlugin,
} from "@mediago/tooling/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = path.resolve(import.meta.dirname, "../..");
loadProfileEnv(projectRoot);
const appRoot = path.resolve(projectRoot, "apps/electron/app");
const isWeb = process.env.APP_TARGET === "server";

const packageJsonPath = path.resolve(appRoot, "package.json");
const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: isWeb ? "node_modules/.vite-server" : "node_modules/.vite-electron",
  server: {
    host: process.env.MEDIAGO_DEV_HOST || "127.0.0.1",
    port: isWeb ? 8501 : 8500,
    strictPort: true,
  },
  plugins: [
    mediaGoBuildMetadataPlugin({
      version: pkg.version,
      target: process.env.APP_TARGET,
      telemetryId: process.env.APP_TD_APPID,
    }),
    react(),
    tailwindcss(),
  ],
  envDir: projectRoot,
  envPrefix: [],
  build: {
    outDir: isWeb ? "build/server" : "build/electron",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: createDependencyChunks({
          zustand: ["zustand", "immer"],
          vendor: ["react-dom", "react-router-dom", "react/"],
        }),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
