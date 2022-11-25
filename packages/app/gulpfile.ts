import { series, dest, watch } from "gulp";
import { createProject } from "gulp-typescript";
import { join } from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs-extra";

const electron = join(__dirname, "node_modules/.bin/electron");

const tsProject = createProject("tsconfig.json");

let electronProcess: ChildProcessWithoutNullStreams | null = null;
let manualRestart = false;

function build(): NodeJS.WritableStream {
  return tsProject.src().pipe(tsProject()).js.pipe(dest("dist"));
}

async function clean(): Promise<void> {
  console.log("123123123");
  const exist = await fs.pathExists("dist");
  if (exist === true) {
    await fs.rm("dist", { recursive: true });
  } 
}

const dev = series(clean, build, startElectron);
const restart = series(clean, build, restartElectron);

watch(["src/**"], restart);

function restartElectron(): void {
  console.log("watch build succeed.");
  if (electronProcess?.pid != null) {
    manualRestart = true;
    process.kill(electronProcess.pid);
    electronProcess = null;
    startElectron();

    setTimeout(() => {
      manualRestart = false;
    }, 5000);
  }
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

export { dev };
