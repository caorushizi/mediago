import { spawn } from "child_process";
import { execa } from "execa";
import { macDownloaderPath, winDownloaderPath } from "./variables";
import iconv from "iconv-lite";
import { event, formatHeaders, formatString, stripColors } from "./utils";
import { DownloadParams, DownloadProgress } from "interfaces";

export const spawnDownload = (params: DownloadParams): Promise<void> => {
  if (process.platform === "win32") {
    return winSpawnDownload(params);
  } else {
    return macSpawnDownload(params);
  }
};

const winSpawnDownload = async (params: DownloadParams): Promise<void> => {
  const { id, abortSignal, url, local, name, deleteSegments, headers } = params;
  const progressReg = /Progress:\s(\d+)\/(\d+)\s\(.+?\).+?\((.+?\/s).*?\)/g;

  return new Promise((resolve, reject) => {
    const spawnParams = [
      formatString(url),
      "--workDir",
      formatString(local),
      "--saveName",
      formatString(name),
      "--headers",
      formatHeaders(headers),
    ];

    if (deleteSegments) {
      spawnParams.push("--enableDelAfterDone");
    }

    const downloader = execa(winDownloaderPath, spawnParams, {
      detached: true,
      shell: true,
      signal: abortSignal.signal,
    });

    downloader.stdout?.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }

        console.log(item);
        const result = progressReg.exec(item);
        if (!result) {
          return;
        }

        const [, cur, total, speed] = result;
        const progress: DownloadProgress = { id, cur, total, speed };
        event.emit("download-progress", progress);
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

const macSpawnDownload = (params: DownloadParams): Promise<void> => {
  const { id, abortSignal, url, local, name, deleteSegments } = params;
  const progressReg = /([\d.]+)% .*? ([\d.\w]+?) /g;

  return new Promise((resolve, reject) => {
    const spawnParams = [
      url,
      "--tmp-dir",
      local,
      "--save-dir",
      local,
      "--save-name",
      name,
    ];

    if (deleteSegments) {
      spawnParams.push("--del-after-done");
    }

    const downloader = spawn(macDownloaderPath, spawnParams, {
      signal: abortSignal.signal,
    });

    downloader.stdout.on("data", (data) => {
      const str = String(Buffer.from(data));
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }
        const result = progressReg.exec(stripColors(item));
        if (!result) {
          return;
        }

        const [, precentage, speed] = result;
        const cur = String(Number(precentage) * 10);
        if (cur === "0") {
          return;
        }

        const total = "1000";
        const progress: DownloadProgress = { id, cur, total, speed };
        event.emit("download-progress", progress);
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
