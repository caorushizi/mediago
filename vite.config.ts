import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "renderer/main_window/index.html"),
        browser: resolve(__dirname, "renderer/browser_window/index.html"),
      },
    },
    outDir: resolve(__dirname, "dist"),
  },
  root: "renderer",
});
