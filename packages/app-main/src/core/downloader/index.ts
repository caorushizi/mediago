import MediaGoDownloader from "./MediaGoDownloader";
import NM3u8DlCliDownloader from "./NM3u8DlCliDownloader";
import Downloader from "./Downloader";

const createDownloader = (type: string): Downloader => {
  if (type === "mediago") {
    return new MediaGoDownloader();
  }
  if (type === "N_m3u8DL-CLI") {
    return new NM3u8DlCliDownloader();
  }
  throw new Error("暂不支持该下载方式");
};

export { createDownloader };
