import { spawn } from "child_process";
import { cpSync, existsSync } from "node:fs";
import electron from "electron";
import * as esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainResolve = (r) => resolve(__dirname, "..", r);
const rootResolve = (r) => resolve(__dirname, "../../..", r);

let electronProcess = null;

const env = existsSync(rootResolve(".env.development.local"))
  ? rootResolve(".env.development.local")
  : rootResolve(".env.development");
dotenv.config({ path: env });

async function copySource() {
  const oldSqlite3Path = mainResolve(
    "node_modules/better-sqlite3/build/Release"
  );
  const newSqlite3Path = mainResolve("build/Release");

  cpSync(oldSqlite3Path, newSqlite3Path, {
    recursive: true,
  });

  const oldBinPath = mainResolve("bin");
  const newBinPath = mainResolve("build/bin");

  cpSync(oldBinPath, newBinPath, {
    recursive: true,
  });
}

const ctx = await esbuild.context({
  entryPoints: [mainResolve("src/index.ts"), mainResolve("src/preload.ts")],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node16.13"],
  external: ["electron", "mock-aws-s3", "aws-sdk", "nock"],
  define: {
    // 开发环境中二进制可执行文件的路径
    __bin__: `"${mainResolve("bin").replace(/\\/g, "\\\\")}"`,
  },
  plugins: [],
  outdir: mainResolve("build/main"),
  loader: { ".png": "file" },
});

const watcher = chokidar.watch("./src");

watcher.on("change", async () => {
  await ctx.rebuild();
  console.log("watch build succeed.");
  if (electronProcess && electronProcess.kill) {
    process.kill(electronProcess.pid);
    electronProcess = null;
    startElectron();
  }
});

function startElectron() {
  const args = ["--inspect=5858", mainResolve("build/main/index.js")];

  electronProcess = spawn(String(electron), args);

  electronProcess.stdout.on("data", (data) => {
    console.log(String(data));
  });

  electronProcess.stderr.on("data", (data) => {
    console.log(String(data));
  });
}

try {
  await ctx.rebuild();
  await copySource();
  await startElectron();
} catch (e) {
  console.error(e);
  process.exit();
}
