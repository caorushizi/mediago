import { execa } from "execa";
import { formatHeaders, winDownloaderPath } from "helper";
import { DownloadParams, DownloadProgress } from "interfaces";
import iconv from "iconv-lite";

export const winSpawnDownload = async (
  params: DownloadParams
): Promise<void> => {
  const {
    id,
    abortSignal,
    url,
    local,
    name,
    deleteSegments,
    headers,
    callback,
    proxy,
  } = params;
  const progressReg = /Progress:\s(\d+)\/(\d+)\s\(.+?\).+?\((.+?\/s).*?\)/g;
  const isLiveReg = /识别为直播流, 开始录制/g;
  const startDownloadReg = /开始下载文件/g;

  return new Promise((resolve, reject) => {
    const spawnParams = [url, "--workDir", local, "--saveName", name];

    if (headers) {
      spawnParams.push("--headers", formatHeaders(headers));
    }

    if (deleteSegments) {
      spawnParams.push("--enableDelAfterDone");
    }

    if (proxy) {
      spawnParams.push("--proxyAddress", proxy);
    }

    const downloader = execa(winDownloaderPath, spawnParams, {
      signal: abortSignal.signal,
    });

    let isLive = false;
    downloader.stdout?.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }

        if (isLiveReg.test(item) || startDownloadReg.test(item)) {
          callback({
            id,
            type: "ready",
            isLive,
            cur: "",
            total: "",
            speed: "",
          });
          isLive = true;
        }

        const result = progressReg.exec(item);
        if (!result) {
          return;
        }

        const [, cur, total, speed] = result;
        const progress: DownloadProgress = {
          id,
          type: "progress",
          cur,
          total,
          speed,
          isLive,
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
