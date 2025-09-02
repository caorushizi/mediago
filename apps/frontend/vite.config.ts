import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const isWeb = process.env.APP_TARGET === "web";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8555,
    strictPort: true,
  },
  plugins: [react()],
  envDir: "../..",
  envPrefix: "APP",
  build: {
    outDir: isWeb
      ? path.resolve(__dirname, "../backend/dist/app")
      : path.resolve(__dirname, "../main/app/build/renderer"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
