import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const projectRoot = path.resolve(__dirname, "../..");

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8556,
    strictPort: true,
    host: true,
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(projectRoot, "app/mobile"),
    emptyOutDir: true,
  },
  envDir: projectRoot,
  envPrefix: "APP",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
