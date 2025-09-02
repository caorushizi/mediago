import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8556,
    strictPort: true,
    host: true,
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../main/app/mobile"),
    emptyOutDir: true,
  },
  envDir: "../..",
  envPrefix: "APP",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
