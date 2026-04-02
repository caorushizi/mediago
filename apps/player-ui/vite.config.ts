import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  clearScreen: false,
  server: {
    port: 8556,
    strictPort: true,
  },
  envDir: "../../",
  base: "/player/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("video.js")) return "videojs";
          if (id.includes("react-dom") || id.includes("react/"))
            return "vendor";
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
