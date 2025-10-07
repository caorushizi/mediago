import path from "node:path";
import { defineConfig } from "vite";

const projectRoot = path.resolve(__dirname, "../..");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/main.ts"),
      name: "plugin",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    rollupOptions: {},
    outDir: "build",
  },
  envDir: projectRoot,
  server: {
    port: 8080,
    cors: true,
    origin: "http://localhost:8080",
  },
});
