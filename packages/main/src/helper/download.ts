import { spawn } from "child_process";
import { downloaderPath } from "./variables";
import iconv from "iconv-lite";
import { event } from "./utils";
import { DownloadProgress } from "interfaces";

const progressReg = /Progress:\s(\d+)\/(\d+)\s\(.+?\).+?\((.+?\/s).*?\)/g;

export const spawnDownload = (
  id: number,
  url: string,
  local: string,
  name: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const downloader = spawn(downloaderPath, [
      url,
      "--workDir",
      local,
      "--saveName",
      name,
    ]);

    downloader.stdout.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }
        const result = progressReg.exec(item);
        if (result) {
          const [, cur, total, speed] = result;
          const progress: DownloadProgress = { id, cur, total, speed };
          event.emit("download-progress", progress);
        }
      });
    });

    // TODO: 错误处理
    downloader.stderr.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }
        console.log(item);
      });
    });

    downloader.on("close", (code) => {
      console.log("test: ", code);

      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};
