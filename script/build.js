const { build } = require("vite");
const { resolve } = require("path");
const rimraf = require("rimraf");

rimraf.sync(resolve(__dirname, "../dist"));

const { parsed } = require("dotenv").config({
  path: resolve(__dirname, `../.env.${process.env.NODE_ENV}.local`),
});

const mainDefined = Object.keys(parsed || {}).reduce((prev, cur) => {
  prev[`process.env.${[cur]}`] = JSON.stringify(parsed[cur]);
  return prev;
}, {});

function buildMain() {
  return require("esbuild").build({
    entryPoints: [
      resolve(__dirname, "../src/main/index.ts"),
      resolve(__dirname, "../src/preload/index.ts"),
    ],
    bundle: true,
    platform: "node",
    sourcemap: false,
    target: ["node10.4"],
    external: ["electron"],
    outdir: resolve(__dirname, "../dist"),
    loader: { ".png": "file" },
    define: {
      ...mainDefined,
    },
  });
}

function buildRenderer() {
  return build({
    configFile: false,
    root: resolve(__dirname, "../"),
    resolve: {
      alias: [
        {
          find: /^renderer/,
          replacement: resolve(__dirname, "../src/renderer"),
        },
        { find: /^types/, replacement: resolve(__dirname, "../src/types") },
        { find: /^~/, replacement: "" },
      ],
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    build: {
      outDir: "dist/renderer",
    },
  });
}

(async () => {
  try {
    await buildRenderer();
    await buildMain();
  } catch (e) {
    console.error(e);
    process.exit();
  }
})();
