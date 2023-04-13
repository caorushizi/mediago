import { spawn } from "child_process";
import { downloaderPath } from "./variables";
import iconv from "iconv-lite";
import { event } from "./utils";
import { DownloadParams, DownloadProgress } from "interfaces";

const progressReg = /Progress:\s(\d+)\/(\d+)\s\(.+?\).+?\((.+?\/s).*?\)/g;

export const spawnDownload = (params: DownloadParams): Promise<void> => {
  const { id, abortSignal, url, local, name, deleteSegments } = params;

  return new Promise((resolve, reject) => {
    // const downloader = spawn(downloaderPath, [
    //   url,
    //   "--save-dir",
    //   local,
    //   "--save-name",
    //   name,
    // ]);

    const spawnParams = [url, "--workDir", local, "--saveName", name];

    if (deleteSegments) {
      spawnParams.push("--enableDelAfterDone");
    }

    const downloader = spawn(downloaderPath, spawnParams, {
      signal: abortSignal.signal,
    });

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

    downloader.on("error", (err) => {
      reject(err);
    });

    downloader.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("未知错误"));
      }
    });
  });
};
