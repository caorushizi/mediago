import { stripColors, biliDownloaderBin } from "../../helper";
import { DownloadParams, DownloadProgress } from "../../interfaces";
import { cmdr } from "./cmdr";

export const biliDownloader = async (params: DownloadParams): Promise<void> => {
  const { id, abortSignal, url, local, callback } = params;
  // const progressReg = /([\d.]+)% .*? ([\d.\w]+?) /g;
  const progressReg = /([\d.]+)%/g;
  const errorReg = /ERROR/g;
  const startDownloadReg = /保存文件名:/g;
  const isLiveReg = /检测到直播流/g;

  const spawnParams = [url, "--work-dir", local];

  await cmdr(biliDownloaderBin, spawnParams, {
    detached: true,
    shell: true,
    abortSignal,
    onMessage: (message) => {
      if (isLiveReg.test(message) || startDownloadReg.test(message)) {
        callback({
          id,
          type: "ready",
          isLive: false,
          cur: "",
          total: "",
          speed: "",
        });
      }

      const log = stripColors(message);
      if (errorReg.test(log)) {
        throw new Error(log);
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
    },
  });
};
