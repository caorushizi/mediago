import { spawn } from "child_process";

const exec = (exeFile, ...args) =>
  new Promise((resolve, reject) => {
    const [localPath, name, url, headers] = args;

    // 判断使用的可执行程序
    let binName = "";
    let argsArr;
    switch (exeFile) {
      case "mediago":
        binName = "mediago";
        argsArr = [
          `--path="${localPath}"`,
          `--name="${name}"`,
          `--url="${url}"`,
          `--headers="${headers}"`,
        ];
        break;
      case "N_m3u8DL-CLI":
        // fixme : 需要修改这个参数
        binName = "N_m3u8DL-CLI_v2.9.4";
        argsArr = [
          `"${url}"`,
          "--workDir",
          `"${localPath}"`,
          "--saveName",
          `"${name}"`,
          "--headers",
          `"${headers}"`,
        ];
        break;
      default:
        throw new Error("暂不支持该下载方式");
    }

    console.log(argsArr.join(" "));
    const command = spawn(binName, argsArr, {
      detached: true,
      shell: true,
    });
    let errMsg = "";

    command.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    command.stderr.on("data", (data) => {
      errMsg += data;
    });

    command.on("close", (code) => {
      console.log(code, "CODECODE");
      if (code !== 0) {
        console.log("开始下载失败：", errMsg);
        reject(new Error("下载失败请稍后重试"));
      } else {
        resolve("下载视频成功");
      }
    });
  });

const successFn = (data) => ({ code: 0, msg: "", data });
const failFn = (code, msg) => ({ code, msg, data: null });

export { exec, successFn, failFn };
