import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = path.resolve(__dirname, "../..");
const isWeb = process.env.APP_TARGET === "server";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8555,
    strictPort: true,
  },
  plugins: [react()],
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
