import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  platform: "browser",
  outDir: "build",
  format: "cjs",
  noExternal: [/.*/],
  external: ["electron"],
  minify: true,
  sourcemap: true,
});
