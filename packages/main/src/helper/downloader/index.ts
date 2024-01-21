import { DownloadParams } from "../../interfaces";
import { m3u8DownloaderWin32 } from "./m3u8-win32";
import { m3u8DownloaderDarwin } from "./m3u8-darwin";
import { biliDownloader } from "./bilibili";
import { isWin } from "../variables";

export const downloader = (params: DownloadParams): Promise<void> => {
  if (params.type === "bilibili") {
    return biliDownloader(params);
  }

  if (params.type === "m3u8") {
    if (isWin) {
      return m3u8DownloaderWin32(params);
    } else {
      return m3u8DownloaderDarwin(params);
    }
  }

  return Promise.reject();
};
