import { spawn, SpawnOptions } from "child_process";
import glob from "glob";
import { workspace } from "main/variables";
import spawnArgs from "main/utils/spawn-args";
import { EventEmitter } from "events";
import log from "electron-log";
import Store from "electron-store";

// 封装 spawn 方法
const spawnWrapper = (
  command: string,
  args: string,
  options: SpawnOptions
): Promise<void> =>
  new Promise((resolve, reject) => {
    const spawnCommand = spawn(command, spawnArgs(args), {
      cwd: workspace,
      ...options,
    });

    spawnCommand.stderr?.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    spawnCommand.on("close", (code) => {
      if (code !== 0) reject(new Error(`调用 ${command} 可执行文件执行失败`));
      else resolve();
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

const eventEmitter = new EventEmitter();

log.transports.console.format = "{h}:{i}:{s} {text}";
log.transports.file.getFile();

const store = new Store({
  name: "config",
  cwd: workspace,
  fileExtension: "json",
  defaults: { workspace: "", exeFile: "N_m3u8DL-CLI", tip: true },
});

export {
  successFn,
  failFn,
  globWrapper,
  spawnWrapper,
  eventEmitter,
  log,
  store,
  spawnArgs,
};
