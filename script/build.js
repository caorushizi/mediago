const { resolve } = require("path");
console.log(__dirname);
require("esbuild").buildSync({
  entryPoints: [resolve(__dirname, "../main/index.ts")],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  outdir: resolve(__dirname, "../dist/"),
});
