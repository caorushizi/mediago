import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import electron from "electron";
import { defineConfig } from "tsdown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV === "development";
const projectRoot = path.resolve(__dirname, "../..");
const devBinPath = path.resolve(projectRoot, "bin", process.platform, process.arch);
const prodBinPath = path.resolve(projectRoot, "bin");

export class ElectronApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = ["--inspect=5858", path.resolve(__dirname, "./build/index.js")];

    this.process = spawn(String(electron), args);

    this.process.stdout.on("data", (data) => {
      console.log(String(data));
    });

    this.process.stderr.on("data", (data) => {
      console.log(String(data));
    });
  }

  restart() {
    this.kill();
    this.start();
  }

  kill() {
    if (this.process?.pid) {
      if (process.platform === "win32") {
        process.kill(this.process.pid);
      } else {
        spawn("kill", ["-9", String(this.process.pid)]);
      }
      this.process = null;
    }
  }
}

const app = new ElectronApp();

export default defineConfig({
  outDir: "build",
  shims: true,
  external: ["electron"],
  define: {
    __bin__: isDev ? `"${devBinPath.replace(/\\/g, "\\\\")}"` : `"${prodBinPath.replace(/\\/g, "\\\\")}"`,
  },
  loader: {
    ".jpg": "asset",
    ".png": "asset",
  },
  hooks: {
    "build:done": () => {
      if (process.env.NODE_ENV === "development") {
        app.restart();
      }
    },
  },
});
