import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  dts: {
    tsgo: true,
  },
  platform: "browser",
  outDir: "build",
  format: "cjs",
  noExternal: ["@mediago/shared-node", "@mediago/shared-common"],
  external: ["electron"],
});
