import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import electron from "electron";
import * as esbuild from "esbuild";
import chokidar from "chokidar";
import { loadDotEnvRuntime, mainResolve, log, copyResource } from "./utils";

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

async function startElectron() {
  const ctx = await esbuild.context({
    entryPoints: [
      mainResolve("src/index.ts"),
      mainResolve("src/preload.ts"),
      mainResolve("src/webview.ts"),
    ],
    bundle: true,
    platform: "node",
    sourcemap: true,
    target: ["node16.13"],
    external: [
      "electron",
      "mock-aws-s3",
      "aws-sdk",
      "nock",
      "@cliqz/adblocker-electron-preload",
    ],
    define: {
      // 开发环境中二进制可执行文件的路径
      __bin__: `"${mainResolve("bin", process.platform).replace(
        /\\/g,
        "\\\\"
      )}"`,
    },
    plugins: [],
    outdir: mainResolve("app/build/main"),
    loader: { ".png": "file" },
  });

  const watcher = chokidar.watch("./src");

  watcher.on("change", async () => {
    await ctx.rebuild();
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

  try {
    await ctx.rebuild();
    await copySource();
    await startElectron();
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

startElectron();
