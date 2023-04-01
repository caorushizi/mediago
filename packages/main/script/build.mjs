import * as esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, rmSync } from "node:fs";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainResolve = (r) => resolve(__dirname, "..", r);
const rootResolve = (r) => resolve(__dirname, "../../..", r);

const nodeEnv = process.env.NODE_ENV;
console.log("当前的环境是： ", nodeEnv);

const env = existsSync(rootResolve(`.env.${nodeEnv}.local`))
  ? rootResolve(`.env.${nodeEnv}.local`)
  : rootResolve(`.env.${nodeEnv}`);
dotenv.config({ path: env });

rmSync(mainResolve("build/main"), { recursive: true, force: true });
rmSync(mainResolve("build/Release"), { recursive: true, force: true });

esbuild.build({
  entryPoints: [mainResolve("src/index.ts"), mainResolve("src/preload.ts")],
  bundle: true,
  platform: "node",
  sourcemap: false,
  target: ["node16.13"],
  external: ["electron", "nock", "aws-sdk", "mock-aws-s3"],
  outdir: mainResolve("build/main"),
  loader: { ".png": "file" },
  minify: true,
});
