const { createServer } = require("vite");
const chalk = require("chalk");
const { resolve } = require("path");
const electron = require("electron");
const reactRefresh = require("@vitejs/plugin-react-refresh");
const path = require("path");
const { spawn } = require("child_process");
// const eslint = require("@rollup/plugin-eslint");

let electronProcess = null;
let manualRestart = false;

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

function startMain() {
  return require("esbuild").build({
    entryPoints: [
      resolve(__dirname, "../src/main/index.ts"),
      resolve(__dirname, "../src/preload/index.ts"),
    ],
    bundle: true,
    platform: "node",
    sourcemap: true,
    target: ["node10.4"],
    external: ["electron"],
    define: {
      // 开发环境中二进制可执行文件的路径
      __bin__: `"${resolve(__dirname, "../.bin").replace(/\\/g, "\\\\")}"`,
    },
    outdir: resolve(__dirname, "../dist"),
    loader: { ".png": "file" },
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error("watch build failed:", error);
        } else {
          console.log("watch build succeed:", result);
          if (electronProcess && electronProcess.kill) {
            manualRestart = true;
            process.kill(electronProcess.pid);
            electronProcess = null;
            startElectron();

            setTimeout(() => {
              manualRestart = false;
            }, 5000);
          }
        }
      },
    },
  });
}

function startRenderer() {
  return createServer({
    configFile: false,
    root: resolve(__dirname, "../"),
    server: {
      port: 7789,
      strictPort: true,
    },
    resolve: {
      alias: [
        {
          find: /^renderer/,
          replacement: resolve(__dirname, "../src/renderer"),
        },
        { find: /^types/, replacement: resolve(__dirname, "../src/types") },
        { find: /^~/, replacement: "" },
      ],
    },
    plugins: [
      // {
      //   ...eslint({
      //     include: "**/*.+(js|jsx|ts|tsx)",
      //   }),
      //   enforce: "pre",
      //   apply: "serve",
      // },
      reactRefresh(),
    ],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
  });
}

function startElectron() {
  let args = ["--inspect=5858", path.join(__dirname, "../dist/main/index.js")];

  electronProcess = spawn(String(electron), args);

  electronProcess.stdout.on("data", (data) => {
    electronLog(data, "blue");
  });

  electronProcess.stderr.on("data", (data) => {
    electronLog(data, "red");
  });

  electronProcess.on("close", () => {
    if (!manualRestart) process.exit();
  });
}

function electronLog(data, color) {
  let log = "";
  data = data.toString().split(/\r?\n/);
  data.forEach((line) => {
    if (line.trim()) log += `${chalk[color].bold("electron: ")}  ${line}\n`;
  });
  console.log(log);
}

(async () => {
  try {
    const [server] = await Promise.all([startRenderer(), startMain()]);
    await server.listen();
    startElectron();
  } catch (e) {
    console.error(e);
    process.exit();
  }
})();
