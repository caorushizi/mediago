import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import electron from "electron";
import * as esbuild from "esbuild";
import chokidar from "chokidar";
import { loadDotEnvRuntime, mainResolve, log, copyResource } from "./utils";
import { external } from "./config";

let electronProcess: ChildProcessWithoutNullStreams | null = null;

process.env.NODE_ENV = "development";
loadDotEnvRuntime();

async function copySource() {
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
}

const buildConfig: esbuild.BuildOptions = {
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node16.13"],
  external,
  define: {
    // 开发环境中二进制可执行文件的路径
    __bin__: `"${mainResolve("bin", process.platform).replace(/\\/g, "\\\\")}"`,
  },
  plugins: [],
  outdir: mainResolve("app/build/main"),
  loader: { ".png": "file" },
};

function startElectron() {
  const args = ["--inspect=5858", mainResolve("app/build/main/index.js")];

  electronProcess = spawn(String(electron), args);

  electronProcess.stdout.on("data", (data) => {
    log(String(data));
  });

  electronProcess.stderr.on("data", (data) => {
    log(String(data));
  });
}

async function start() {
  const mainContext = await esbuild.context({
    ...buildConfig,
    entryPoints: [mainResolve("src/index.ts")],
  });

  const preloadContext = await esbuild.context({
    ...buildConfig,
    entryPoints: [
      mainResolve("src/preload.ts"),
      mainResolve("src/devReload.ts"),
    ],
    platform: "browser",
  });

  const watcher = chokidar.watch("./src");

  watcher.on("change", async () => {
    await mainContext.rebuild();
    await preloadContext.rebuild();
    log("watch build succeed.");
    if (electronProcess && electronProcess.pid) {
      if (process.platform === "darwin") {
        spawn("kill", ["-9", String(electronProcess.pid)]);
      } else {
        process.kill(electronProcess.pid);
      }
      electronProcess = null;
      startElectron();
    }
  });

  try {
    await mainContext.rebuild();
    await preloadContext.rebuild();
    await copySource();
    await startElectron();
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

start();
