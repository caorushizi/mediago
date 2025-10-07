import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const projectRoot = path.resolve(__dirname, "../..");

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8556,
    strictPort: true,
    host: true,
  },
  plugins: [react()],
  build: {},
  envDir: projectRoot,
  envPrefix: "APP",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
