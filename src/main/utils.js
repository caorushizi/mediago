import { spawn } from "child_process";
import glob from "glob";
import spawnargs from "spawn-args";
import semver from "semver";
import { workspace } from "./variables";

const spawnWrapper = (command, args, options) =>
  new Promise((resolve, reject) => {
    const spawnCommand = spawn(command, spawnargs(args), {
      cwd: workspace,
      ...options,
    });
    let errMsg = "";

    spawnCommand.stderr.on("data", (data) => {
      errMsg += data;
    });

    spawnCommand.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errMsg));
      } else {
        resolve();
      }
    });
  });

const globWrapper = (pattern) =>
  new Promise((resolve, reject) => {
    glob(pattern, { cwd: workspace }, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });

const exec = async (exeFile, ...args) => {
  const [localPath, name, url, headers] = args;

  // 判断使用的可执行程序
  let binName = "";
  let argsArr;

  switch (exeFile) {
    case "mediago":
      binName = "mediago";
      argsArr = `--path="${localPath}" --name="${name}" --url="${url}" --headers="${headers}"`;
      break;
    case "N_m3u8DL-CLI": {
      let binNameList = await globWrapper("N_m3u8DL-CLI*.exe");
      binNameList = binNameList
        .map((item) => /N_m3u8DL-CLI_v(.*).exe/.exec(item)?.[1] || "0.0.0")
        .filter((item) => semver.valid(item))
        .sort((a, b) => (semver.gt(a, b) ? -1 : 1));
      if (binNameList.length === 0) throw new Error("没有找到可执行程序");
      binName = `N_m3u8DL-CLI_v${binNameList[0]}`;

      argsArr = `"${url}" --workDir "${localPath}" --saveName "${name}" --headers "${headers}"`;
      break;
    }
    default:
      throw new Error("暂不支持该下载方式");
  }

  return spawnWrapper(binName, argsArr, {
    detached: true,
    shell: true,
  });
};

const successFn = (data) => ({ code: 0, msg: "", data });
const failFn = (code, msg) => ({ code, msg, data: null });

export { exec, successFn, failFn, globWrapper, spawnWrapper };
