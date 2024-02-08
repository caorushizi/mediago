import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/main.tsx"),
      name: "plugin",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    outDir: path.resolve(__dirname, "../../main/app/plugin"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["electron/renderer"],
    },
  },
  server: {
    origin: "http://localhost:5173",
  },
});
