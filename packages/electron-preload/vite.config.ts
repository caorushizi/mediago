import path from "node:path";
import { defineConfig } from "vite";

const projectRoot = path.resolve(__dirname, "../..");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/index.ts"),
      name: "preload",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["electron"],
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  envDir: projectRoot,
});
