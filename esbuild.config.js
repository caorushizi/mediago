const { resolve } = require("path");
console.log(__dirname);

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

require("esbuild").buildSync({
  entryPoints: [resolve(__dirname, "./main/index.ts")],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  define: {},
  outdir: resolve(__dirname, "./dist/"),
});
