import {
  Downloader,
  MediaGoDownloader,
  NM3u8DlCliDownloader,
} from "../core/downloader";

const successFn = (data: unknown): IpcResponse => ({ code: 0, msg: "", data });
const failFn = (code: number, msg: string): IpcResponse => ({
  code,
  msg,
  data: null,
});

const createDownloader = (type: string): Downloader => {
  if (type === "mediago") {
    return new MediaGoDownloader();
  }
  if (type === "N_m3u8DL-CLI") {
    return new NM3u8DlCliDownloader();
  }
  throw new Error("暂不支持该下载方式");
};

const processHeaders = (headers: Record<string, string>): string => {
  return Object.entries(headers).reduce((prev, cur) => {
    const [key, value] = cur;
    return prev + `${key}: ${value}\n`;
  }, "");
};

export { createDownloader, processHeaders };

export { successFn, failFn };
