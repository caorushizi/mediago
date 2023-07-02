import * as esbuild from "esbuild";
import { rmSync } from "node:fs";
import { mainResolve, loadDotEnvDefined } from "./utils.mjs";

const mainDefined = loadDotEnvDefined();

rmSync(mainResolve("build"), { recursive: true, force: true });
rmSync(mainResolve("dist"), { recursive: true, force: true });

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
  outdir: mainResolve("build/main"),
  loader: { ".png": "file" },
  minify: true,
});
