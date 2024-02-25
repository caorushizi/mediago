import * as esbuild from "esbuild";
import {
  mainResolve,
  loadDotEnvDefined,
  copyResource,
  removeResource,
} from "./utils";
import { external } from "./config";

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
  entryPoints: [mainResolve("src/index.ts")],
  bundle: true,
  platform: "node",
  sourcemap: false,
  target: ["node16.13"],
  external,
  define: {
    "process.env.NODE_ENV": '"production"',
    ...mainDefined,
  },
  outdir: mainResolve("app/build/main"),
  loader: { ".png": "file" },
  minify: true,
  plugins: [],
});

esbuild.build({
  entryPoints: [mainResolve("src/preload.ts")],
  bundle: true,
  platform: "browser",
  target: ["chrome89"],
  sourcemap: false,
  external,
  define: {
    "process.env.NODE_ENV": '"production"',
    ...mainDefined,
  },
  outdir: mainResolve("app/build/main"),
  loader: { ".png": "file" },
  minify: true,
});
