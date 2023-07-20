import { execa } from "execa";
import { stripColors, biliDownloader } from "helper";
import { DownloadParams, DownloadProgress } from "interfaces";

export const bilibiliDownload = (params: DownloadParams): Promise<void> => {
  const { id, abortSignal, url, local, callback } = params;
  // const progressReg = /([\d.]+)% .*? ([\d.\w]+?) /g;
  const progressReg = /([\d.]+)%/g;
  const errorReg = /ERROR/g;
  const startDownloadReg = /保存文件名:/g;
  const isLiveReg = /检测到直播流/g;

  return new Promise((resolve, reject) => {
    const spawnParams = [url, "--work-dir", local];

    const downloader = execa(biliDownloader, spawnParams, {
      detached: true,
      shell: true,
      signal: abortSignal.signal,
    });

    downloader.stdout?.on("data", (data) => {
      const str = String(Buffer.from(data));
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }

        if (isLiveReg.test(item) || startDownloadReg.test(item)) {
          callback({
            id,
            type: "ready",
            isLive: false,
            cur: "",
            total: "",
            speed: "",
          });
        }

        const log = stripColors(item);

        if (errorReg.test(log)) {
          reject(new Error(log));
          return;
        }

        const result = progressReg.exec(log);
        if (!result) {
          return;
        }

        const [, precentage, speed] = result;
        const cur = String(Number(precentage) * 10);
        if (cur === "0") {
          return;
        }

        const total = "1000";
        // FIXME: 无法获取是否为直播流
        const progress: DownloadProgress = {
          id,
          type: "progress",
          cur,
          total,
          speed,
          isLive: false,
        };
        callback(progress);
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
