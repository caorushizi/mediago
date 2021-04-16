import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  server: {
    port: 7789,
    strictPort: true,
  },
  build: {
    target: "es2015",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "main_window.html"),
        browser: resolve(__dirname, "browser_window.html"),
      },
    },
    outDir: resolve(__dirname, "dist/electron"),
  },
  resolve: {
    alias: [
      { find: "renderer", replacement: resolve(__dirname, "renderer") },
      { find: "types", replacement: resolve(__dirname, "types") },
      { find: /^~/, replacement: "" },
    ],
  },
});
