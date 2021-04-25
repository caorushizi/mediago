import { spawn, SpawnOptions } from "child_process";
import glob from "glob";
import semver from "semver";
import { workspace } from "main/utils/variables";
import logger from "./logger";
import { M3u8DLArgs, MediaGoArgs } from "types/common";
import spawnArgs from "main/utils/spawn-args";

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

const execM3u8DL = async (args: M3u8DLArgs): Promise<string[]> => {
  let binNameList = await globWrapper("N_m3u8DL-CLI*.exe", {
    cwd: __bin__,
  });
  binNameList = binNameList
    .map((item) => /N_m3u8DL-CLI_v(.*).exe/.exec(item)?.[1] || "0.0.0")
    .filter((item) => semver.valid(item))
    .sort((a, b) => (semver.gt(a, b) ? -1 : 1));
  if (binNameList.length === 0) throw new Error("没有找到 N_m3u8DL-CLI");
  const binName = `N_m3u8DL-CLI_v${binNameList[0]}`;

  let argsStr = Object.entries(args)
    .reduce((prev: string[], [key, value]) => {
      if (key === "url") return prev;
      if (value && typeof key === "boolean") prev.push(`--${key}`);
      if (value && typeof key === "string") prev.push(`--${key} "${value}"`);
      return prev;
    }, [])
    .join(" ");
  argsStr = `"${args.url}" ${argsStr}`;
  return [binName, argsStr];
};

const execMediaGo = async (args: MediaGoArgs): Promise<string[]> => {
  const binName = "mediago";
  const argsStr = Object.entries(args)
    .reduce((prev: string[], [key, value]) => {
      if (value) prev.push(`-${key} "${value}"`);
      return prev;
    }, [])
    .join(" ");
  return [binName, argsStr];
};

const exec = async (
  exeFile: string,
  args: M3u8DLArgs | MediaGoArgs
): Promise<void> => {
  let binName = "";
  let argsStr = "";

  switch (exeFile) {
    case "mediago":
      [binName, argsStr] = await execMediaGo(args as MediaGoArgs);
      break;
    case "N_m3u8DL-CLI": {
      [binName, argsStr] = await execM3u8DL(args as M3u8DLArgs);
      break;
    }
    default:
      throw new Error("暂不支持该下载方式");
  }

  logger.info("下载参数：", __bin__, binName, argsStr);
  return spawnWrapper(binName, argsStr, {
    detached: true,
    shell: true,
    cwd: __bin__,
  });
};

const successFn = (data: any) => ({ code: 0, msg: "", data });
const failFn = (code: number, msg: string) => ({ code, msg, data: null });

export { exec, successFn, failFn, globWrapper, spawnWrapper };
