import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
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
});
