import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/main.tsx"),
      name: "plugin",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    outDir: path.resolve(__dirname, "../main/app/plugin"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["electron/renderer"],
    },
  },
  server: {
    port: 8080,
    cors: true,
  },
});
