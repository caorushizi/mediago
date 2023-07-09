import * as esbuild from "esbuild";
import {
  mainResolve,
  loadDotEnvDefined,
  copyResource,
  removeResource,
} from "./utils.mjs";

const mainDefined = loadDotEnvDefined();

removeResource([mainResolve("app/build")]);
removeResource([mainResolve("app/bin")]);

const path = "build/Release/better_sqlite3.node";

copyResource([
  {
    from: mainResolve("node_modules/better-sqlite3", path),
    to: mainResolve("app", path),
  },
  {
    from: mainResolve("bin"),
    to: mainResolve("app/bin"),
  },
]);

esbuild.build({
  entryPoints: [
    mainResolve("src/index.ts"),
    mainResolve("src/preload.ts"),
    mainResolve("src/webview.ts"),
  ],
  bundle: true,
  platform: "node",
  sourcemap: false,
  target: ["node16.13"],
  external: [
    "electron",
    "nock",
    "aws-sdk",
    "mock-aws-s3",
    "@cliqz/adblocker-electron-preload",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    ...mainDefined,
  },
  outdir: mainResolve("app/build/main"),
  loader: { ".png": "file" },
  minify: true,
});
