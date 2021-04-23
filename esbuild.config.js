const { resolve } = require("path");

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

const define = {};
if (process.env.NODE_ENV === "development") {
  define.__bin__ = `"${resolve(__dirname, ".bin").replace(/\\/g, "\\\\")}"`;
}

require("esbuild").buildSync({
  entryPoints: [
    resolve(__dirname, "./src/main/index.ts"),
    resolve(__dirname, "./src/main/preload.ts"),
  ],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  define,
  outdir: resolve(__dirname, "./dist/main"),
});
