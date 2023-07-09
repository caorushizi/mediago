import { defineConfig } from "vite";
import { splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8555,
    strictPort: true,
  },
  plugins: [react(), splitVendorChunkPlugin()],
  envDir: "../..",
  envPrefix: "APP",
  build: {
    outDir: path.resolve(__dirname, "../main/app/build/renderer"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: [
            "react",
            "react-dom",
            "react-router-dom",
            "@reduxjs/toolkit",
            "react-redux",
            "sort-by",
          ],
          antd: ["antd"],
          icons: ["@ant-design/icons"],
          "pro-components": ["@ant-design/pro-components"],
          xgplayer: ["xgplayer"],
        },
      },
    },
  },
});
