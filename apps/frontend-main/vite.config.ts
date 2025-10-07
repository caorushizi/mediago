import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const projectRoot = path.resolve(__dirname, "../..");
const isWeb = process.env.APP_TARGET === "web";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8555,
    strictPort: true,
  },
  plugins: [react()],
  envDir: projectRoot,
  envPrefix: "APP",
  build: {
    outDir: isWeb ? "dist/web" : "dist/electron",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
