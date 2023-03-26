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
      "--save-dir",
      local,
      "--save-name",
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
        console.log("str: ", item);
      });
    });

    // TODO: 错误处理
    downloader.stderr.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }
      });
      console.log(str);
    });

    downloader.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};
