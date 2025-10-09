import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path from "node:path";
import electron from "electron";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { globSync } from "glob";
import fs from "node:fs";

const isDev = process.env.NODE_ENV === "development";
const projectRoot = path.resolve(__dirname, "../..");

export class ElectronApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = ["--inspect=5858", path.resolve(__dirname, "./build/index.cjs")];

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

function chmodBin() {
  // Go through all the files in the folder and set the permissions on the files to 777
  if (process.platform === "win32") return;

  const files = globSync(path.resolve(projectRoot, "app/bin/*"));
  for (const file of files) {
    fs.chmodSync(file, 0o777);
  }
}

const devBinPath = path.resolve(projectRoot, "bin", process.platform, process.arch);
const prodBinPath = path.resolve(projectRoot, "bin");

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: "APP",
  define: {
    __bin__: isDev ? `"${devBinPath.replace(/\\/g, "\\\\")}"` : `"${prodBinPath.replace(/\\/g, "\\\\")}"`,
  },
  build: {
    target: "node16",
    ssr: true,
    lib: {
      entry: path.resolve(__dirname, "./src/index.ts"),
      name: "plugin",
      fileName: () => "index.js",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: [
        "electron",
        "@ghostery/adblocker-electron",
        "node-pty",
        "typeorm",
        "@google-cloud/spanner",
        "better-sqlite3",
      ],
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
      name: "electron-reload",
      closeBundle() {
        if (process.env.NODE_ENV !== "development") return;

        app.restart();
        chmodBin();
      },
      buildStart() {
        this.addWatchFile(require.resolve("@mediago/electron-preload"));
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
          dest: "build/Release",
        },
        // {
        //   src: path.resolve(projectRoot, "bin", process.platform, process.arch),
        //   dest: "build/bin",
        // },
        {
          src: "dev-app-update.yml",
          dest: "build/dev-app-update.yml",
        },
      ],
    }),
  ],
});
