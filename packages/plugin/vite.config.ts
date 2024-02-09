import { defineConfig } from "vite";
import path from "path";

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
    outDir: path.resolve(__dirname, "../main/app/plugin"),
    emptyOutDir: true,
    rollupOptions: {},
  },
  server: {
    port: 8080,
    cors: true,
    origin: "http://localhost:8080",
  },
});
