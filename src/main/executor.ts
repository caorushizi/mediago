import { M3u8DLArgs, MediaGoArgs } from "types/common";
import semver from "semver";
import { is } from "electron-util";
import { log } from "main/utils";
import { globWrapper, spawnWrapper } from "main/utils";

const execM3u8DL = async (args: M3u8DLArgs): Promise<string[]> => {
  let binNameList = await globWrapper("N_m3u8DL-CLI*.exe", {
    // @ts-ignore
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
      if (value && typeof value === "boolean") prev.push(`--${key}`);
      if (value && typeof value === "string") prev.push(`--${key} "${value}"`);
      return prev;
    }, [])
    .join(" ");
  argsStr = `"${args.url}" ${argsStr}`;
  return [binName, argsStr];
};

// 执行 mediago 二进制文件
const execMediaGo = async (args: MediaGoArgs): Promise<string[]> => {
  const binName = is.windows ? "mediago" : "./mediago";
  const argsStr = Object.entries(args)
    .reduce((prev: string[], [key, value]) => {
      if (value) prev.push(`-${key} "${value}"`);
      return prev;
    }, [])
    .join(" ");
  return [binName, argsStr];
};

// 开始调用执行可执行文件
const executor = async (
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

  // @ts-ignore
  log.info("下载参数：", __bin__, binName, argsStr);
  return spawnWrapper(binName, argsStr, {
    detached: true,
    shell: true,
    // @ts-ignore
    cwd: __bin__,
  });
};

export default executor;
