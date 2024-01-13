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
      fileName: () => "plugin.js",
      formats: ["umd"],
    },
    outDir: path.resolve(__dirname, "../main/app/plugin"),
    emptyOutDir: true,
  },
  server: {
    origin: "http://localhost:5173",
  },
  optimizeDeps: {
    exclude: ["electron"],
  },
});
