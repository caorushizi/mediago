import { stripColors, m3u8DownloaderBin } from "../../helper";
import { DownloadParams, DownloadProgress } from "../../interfaces";
import { cmdr } from "./cmdr";

export const m3u8DownloaderDarwin = async (
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
  // const progressReg = /([\d.]+)% .*? ([\d.\w]+?) /g;
  const progressReg = /([\d.]+)%/g;
  const errorReg = /ERROR/g;
  const startDownloadReg = /保存文件名:/g;
  const isLiveReg = /检测到直播流/g;

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

  if (proxy) {
    spawnParams.push("--custom-proxy", proxy);
  }

  let isLive = false;
  await cmdr(m3u8DownloaderBin, spawnParams, {
    abortSignal,
    encoding: "gbk",
    onMessage: (message) => {
      if (isLiveReg.test(message) || startDownloadReg.test(message)) {
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
        isLive,
      };
      callback(progress);
    },
  });
};
