import { resolve } from "path";
import { BIN_DIR } from "../const.ts";

export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux",
}

export const isMac = process.platform === Platform.MacOS;
export const isWin = process.platform === Platform.Windows;
export const isLinux = process.platform === Platform.Linux;

export function resolveBin(path: string) {
  if (isWin) {
    path += ".exe";
  }
  return resolve(BIN_DIR, path);
}

export const appName = process.env.APP_NAME || "mediago";
export const defaultScheme = "mediago";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const PRIVACY_WEBVIEW = "webview";

// bin path
export const ffmpegPath = resolveBin("ffmpeg");
export const biliDownloaderBin = resolveBin("BBDown");
export const m3u8DownloaderBin = resolveBin("N_m3u8DL-RE");

// user agent
export const pcUA = "";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
