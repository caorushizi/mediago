import fs from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = path.resolve(__dirname, "../..");
const appRoot = path.resolve(projectRoot, "apps/electron/app");
const isWeb = process.env.APP_TARGET === "server";

const packageJsonPath = path.resolve(appRoot, "package.json");
const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 8555,
    strictPort: true,
  },
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  envDir: projectRoot,
  envPrefix: "APP",
  build: {
    outDir: isWeb ? "build/server" : "build/electron",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
