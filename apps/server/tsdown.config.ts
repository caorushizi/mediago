import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";
import dotenvFlow from "dotenv-flow";

const isDev = process.env.NODE_ENV === "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const env = dotenvFlow.config({
  path: projectRoot,
});

class NodeApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = [path.resolve(__dirname, "./build/index.js")];

    this.process = spawn("node", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

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

const app = new NodeApp();

export default defineConfig({
  outDir: "build",
  shims: true,
  external: ["@mediago/core", "@mediago/deps"],
  noExternal: [/.*/],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
    "process.env.APP_TARGET": JSON.stringify("server"),
  },
  env: { ...env.parsed },
  hooks: {
    "build:done": () => {
      if (isDev) {
        app.restart();
      }
    },
  },
});
