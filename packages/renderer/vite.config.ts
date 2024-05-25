import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
    outDir: path.resolve(__dirname, "../main/app/build/renderer"),
    emptyOutDir: true,
  },
});
