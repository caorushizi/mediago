const fs = require("fs");
const { resolve } = require("path");

const rimraf = require("rimraf");

rimraf.sync(resolve(__dirname, "../build"));

process.env.NODE_ENV = "production";

let envPath = resolve(__dirname, `../../../.env.${process.env.NODE_ENV}.local`);
if (!fs.existsSync(envPath)) {
  envPath = resolve(__dirname, `../../../.env.${process.env.NODE_ENV}`);
}

const { parsed } = require("dotenv").config({ path: envPath });

const mainDefined = Object.keys(parsed || {}).reduce((prev, cur) => {
  prev[`process.env.${[cur]}`] = JSON.stringify(parsed[cur]);
  return prev;
}, {});

require("esbuild").build({
  entryPoints: [
    resolve(__dirname, "../src/index.ts"),
    resolve(__dirname, "../src/preload.ts"),
  ],
  bundle: true,
  platform: "node",
  sourcemap: false,
  target: ["node16.13"],
  external: ["electron"],
  outdir: resolve(__dirname, "../dist"),
  loader: { ".png": "file" },
  define: {
    ...mainDefined,
  },
});
