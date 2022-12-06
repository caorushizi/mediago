import { dest, series, watch } from "gulp";
import { createProject } from "gulp-typescript";
import { join } from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fs from "fs-extra";
import electron from "electron";

const tsProject = createProject("tsconfig.json");

let electronProcess: ChildProcessWithoutNullStreams | null = null;
let manualRestart = false;
let restarting = false;

function build(): NodeJS.WritableStream {
  return tsProject.src().pipe(tsProject()).js.pipe(dest("dist"));
}

async function clean(): Promise<void> {
  const exist = await fs.pathExists("dist");
  if (exist === true) {
    await fs.rm("dist", { recursive: true });
  }
}

async function restartLog(): Promise<void> {
  if (restarting) {
    throw new Error("正在重启");
  }
  restarting = true;
  console.log("restart");
}

export const dev: any = series(clean, build, startElectron);
const restart = series(restartLog, clean, build, restartElectron);

watch(["src/**"], restart);

async function restartElectron(): Promise<void> {
  console.log("watch build succeed.");
  return new Promise((resolve) => {
    if (electronProcess?.pid != null) {
      manualRestart = true;
      process.kill(electronProcess.pid);
      electronProcess = null;
      startElectron();

      setTimeout(() => {
        manualRestart = false;
        restarting = false;
        resolve();
      }, 5000);
    }
  });
}

function startElectron(): void {
  const args = ["--inspect=5858", join(__dirname, "./dist/main.js")];
  electronProcess = spawn(String(electron), args);

  electronProcess.stdout.on("data", electronLog);

  electronProcess.stderr.on("data", electronLog);

  electronProcess.on("close", () => {
    if (!manualRestart) process.exit();
  });
}

function electronLog(data: Buffer): void {
  let log: string = "";
  const lineStr = data.toString().split(/\r?\n/);
  lineStr.forEach((line) => {
    if (line.trim() !== "") {
      log += `${line}\n`;
    }
  });
  console.log(log);
}
