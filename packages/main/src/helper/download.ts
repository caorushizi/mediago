import { execa } from "execa";
import { macDownloaderPath, winDownloaderPath } from "./variables";
import iconv from "iconv-lite";
import { event, formatHeaders, stripColors } from "./utils";
import { DownloadParams, DownloadProgress } from "interfaces";

export const spawnDownload = (params: DownloadParams): Promise<void> => {
  if (process.platform === "win32") {
    return winSpawnDownload(params);
  } else {
    return macSpawnDownload(params);
  }
};

const winSpawnDownload = async (params: DownloadParams): Promise<void> => {
  const {
    id,
    abortSignal,
    url,
    local,
    name,
    deleteSegments,
    headers,
    callback,
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

    const downloader = execa(winDownloaderPath, spawnParams, {
      signal: abortSignal.signal,
    });

    downloader.stdout?.on("data", (data) => {
      const str = iconv.decode(Buffer.from(data), "gbk");
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
        }

        const isLive = isLiveReg.test(item);
        const startDownload = startDownloadReg.test(item);
        if (isLive || startDownload) {
          callback({
            id,
            type: "ready",
            isLive,
            cur: "",
            total: "",
            speed: "",
          });
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

const macSpawnDownload = (params: DownloadParams): Promise<void> => {
  const {
    id,
    abortSignal,
    url,
    local,
    name,
    deleteSegments,
    headers,
    callback,
  } = params;
  const progressReg = /([\d.]+)% .*? ([\d.\w]+?) /g;
  const errorReg = /ERROR/g;

  return new Promise((resolve, reject) => {
    const spawnParams = [
      url,
      "--tmp-dir",
      local,
      "--save-dir",
      local,
      "--save-name",
      name,
      "--auto-select",
    ];

    if (headers) {
      const h: Record<string, unknown> = JSON.parse(headers);
      Object.entries(h).forEach(([k, v]) => {
        spawnParams.push("-H", `${k}: ${v}`);
      });
    }

    if (deleteSegments) {
      spawnParams.push("--del-after-done");
    }

    const downloader = execa(macDownloaderPath, spawnParams, {
      signal: abortSignal.signal,
    });

    downloader.stdout?.on("data", (data) => {
      const str = String(Buffer.from(data));
      str.split("\n").forEach((item) => {
        if (item.trim() == "") {
          return;
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
