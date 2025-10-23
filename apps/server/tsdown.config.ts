import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class NodeApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = [path.resolve(__dirname, "./build/index.js")];

    this.process = spawn("node", args);

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

const app = new NodeApp();

export default defineConfig({
  outDir: "build",
  hooks: {
    "build:done": () => {
      if (process.env.NODE_ENV === "development") {
        app.restart();
      }
    },
  },
});
