import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const projectRoot = path.resolve(__dirname, "../..");

export class NodeApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = [path.resolve(__dirname, "./build/index.cjs")];

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

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: "APP",
  define: {
    __bin__: `"${path.resolve(projectRoot, "bin").replace(/\\/g, "\\\\")}"`,
  },
  build: {
    target: "node16",
    ssr: true,
    lib: {
      entry: path.resolve(__dirname, "./src/index.ts"),
      name: "server",
      fileName: () => "index.cjs",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["better-sqlite3"],
      output: {
        inlineDynamicImports: true,
      },
    },
    outDir: "build",
    sourcemap: process.env.NODE_ENV === "development",
  },
  ssr: {
    noExternal: true,
  },
  envDir: projectRoot,
  plugins: [
    {
      name: "server-reload",
      closeBundle() {
        if (process.env.NODE_ENV !== "development") return;

        app.restart();
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
          dest: "build/Release",
        },
      ],
    }),
  ],
});
