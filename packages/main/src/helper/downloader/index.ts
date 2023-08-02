import { DownloadParams } from "../../interfaces";
import { m3u8Downloader } from "./m3u8";
import { biliDownloader } from "./bilibili";

export const downloader = (params: DownloadParams): Promise<void> => {
  if (params.type === "bilibili") {
    return biliDownloader(params);
  }

  if (params.type === "m3u8") {
    return m3u8Downloader(params);
  }

  return Promise.reject();
};
