import { spawn, SpawnOptions } from "child_process";
import glob from "glob";
import { workspace } from "main/variables";
import spawnArgs from "main/utils/spawn-args";
import log from "electron-log";
import path from "path";
import moment from "moment";
import windowManager from "main/window/windowManager";
import { Windows } from "main/window/variables";
import { is } from "electron-util";

// 封装 spawn 方法
const spawnWrapper = (
  command: string,
  args: string,
  options: SpawnOptions
): Promise<void> =>
  new Promise((resolve, reject) => {
    let terminalWindow: Electron.BrowserWindow | undefined;
    if (is.macos) terminalWindow = windowManager.get(Windows.TERMINAL_WINDOW);

    const spawnCommand = spawn(command, spawnArgs(args), {
      cwd: workspace,
      ...options,
    });

    spawnCommand.stdout?.on("data", (data) => {
      const value = data.toString().trim();
      console.log(`stdout: ${value}`);
      if (terminalWindow) {
        console.log("receive-message", value);
        terminalWindow.webContents.send("receive-message", value);
      }
    });

    spawnCommand.stderr?.on("data", (data) => {
      const value = data.toString().trim();
      console.error(`stderr: ${value}`);
      if (terminalWindow) {
        console.log("receive-message", value);
        terminalWindow.webContents.send("receive-message", value);
      }
    });

    spawnCommand.on("close", (code) => {
      if (code !== 0) reject(new Error(`调用 ${command} 可执行文件执行失败`));
      else resolve();
    });

    spawnCommand.on("error", (err) => {
      console.error(`err: ${err}`);
    });
  });

/**
 * 获取文件目录
 */
const globWrapper: (
  pattern: string,
  options: glob.IOptions
) => Promise<string[]> = (pattern, options = {}) =>
  new Promise((resolve, reject) => {
    glob(pattern, { cwd: workspace, ...options }, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });

interface IpcResponse {
  code: number;
  msg: string;
  data: any;
}

const successFn = (data: any): IpcResponse => ({ code: 0, msg: "", data });
const failFn = (code: number, msg: string): IpcResponse => ({
  code,
  msg,
  data: null,
});

const datetime = moment().format("YYYY-MM-DD");
const logPath = path.resolve(workspace, `logs/${datetime}-mediago.log`);
log.transports.console.format = "{h}:{i}:{s} {text}";
log.transports.file.getFile();
log.transports.file.resolvePath = () => logPath;

export { successFn, failFn, globWrapper, spawnWrapper, log, spawnArgs };
