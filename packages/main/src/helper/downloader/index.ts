import { DownloadParams } from "interfaces";
import { macSpawnDownload } from "./m3u8-macos";
import { winSpawnDownload } from "./m3u8-windows";
import { bilibiliDownload } from "./bilibili";

export const downloader = (params: DownloadParams): Promise<void> => {
  if (params.type === "bilibili") {
    return bilibiliDownload(params);
  }

  if (params.type === "m3u8") {
    if (process.platform === "win32") {
      return winSpawnDownload(params);
    } else {
      return macSpawnDownload(params);
    }
  }

  return Promise.reject();
};
