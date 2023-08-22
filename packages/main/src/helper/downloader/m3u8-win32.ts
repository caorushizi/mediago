import { formatHeaders, m3u8DownloaderBin } from "../../helper";
import { DownloadParams, DownloadProgress } from "../../interfaces";
import { cmdr } from "./cmdr";

export const m3u8DownloaderWin32 = async (
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

      const result = progressReg.exec(message);
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
    },
  });
};
