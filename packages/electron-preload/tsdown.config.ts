import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  dts: {
    tsgo: true,
  },
  platform: "node",
  outDir: "build",
  format: "cjs",
  noExternal: ["@mediago/shared-node", "@mediago/shared-common"],
  external: ["electron"],
});
