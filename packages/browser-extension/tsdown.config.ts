import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  platform: "browser",
  outDir: "build",
  noExternal: [/.*/],
  minify: true,
  sourcemap: true,
});
