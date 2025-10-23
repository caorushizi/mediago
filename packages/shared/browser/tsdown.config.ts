import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  dts: {
    tsgo: true,
  },
  outDir: "build",
  platform: "browser",
});
