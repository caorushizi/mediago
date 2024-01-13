import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/main.tsx"),
      name: "plugin",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    outDir: path.resolve(__dirname, "../../main/app/plugin"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["electron/renderer"],
    },
  },
  server: {
    origin: "http://localhost:5173",
  },
});
