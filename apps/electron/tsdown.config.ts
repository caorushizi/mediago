import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import electron from "electron";
import { defineConfig } from "tsdown";
import dotenvFlow from "dotenv-flow";
import copy from "rollup-plugin-copy";

const isDev = process.env.NODE_ENV === "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const env = dotenvFlow.config({
  path: projectRoot,
});

export class ElectronApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = [
      "--inspect=5858",
      "--trace-deprecation",
      path.resolve(__dirname, "./build/index.js"),
    ];

    this.process = spawn(String(electron), args);

    this.process.stdout.on("data", (data) => {
      process.stdout.write(String(data));
    });

    this.process.stderr.on("data", (data) => {
      process.stderr.write(String(data));
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
  external: [
    "electron",
    "typeorm",
    "better-sqlite3",
    "@mediago/player",
    "@mediago/core",
    "@mediago/deps",
  ],
  noExternal: () => true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
    "process.env.APP_TARGET": JSON.stringify(
      process.env.APP_TARGET || "electron",
    ),
  },
  loader: {
    ".jpg": "asset",
    ".png": "asset",
    ".ico": "asset",
  },
  env: { ...env.parsed },
  hooks: {
    "build:done": () => {
      if (isDev) {
        app.restart();
      }
    },
  },
  plugins: [
    isDev &&
      copy({
        targets: [{ src: "./dev-app-update.yml", dest: "build" }],
      }),
  ],
});
