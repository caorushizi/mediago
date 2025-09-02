import { DownloadType } from "@mediago/shared/common";
import { app } from "electron";
import isDev from "electron-is-dev";
import { resolve } from "path";

const appPath = app.getAppPath();
export const appData = app.getPath("appData");
export const download = app.getPath("downloads");

export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux",
}

export const isMac = process.platform === Platform.MacOS;
export const isWin = process.platform === Platform.Windows;
export const isLinux = process.platform === Platform.Linux;

if (!isDev) {
  global.__bin__ = resolve(appPath, "../bin");
}

export function resolveStatic(path: string) {
  const relativePath = isDev ? "../.." : "..";
  return resolve(appPath, relativePath, path);
}
export function resolveBin(path: string) {
  if (isWin) {
    path += ".exe";
  }
  return resolve(__bin__, path);
}

export const appName = process.env.APP_NAME || "mediago";
export const workspace = resolve(appData, appName);
export const defaultScheme = "mediago";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const PRIVACY_WEBVIEW = "webview";
export const db = resolve(workspace, "app.db");

// bin path
export const ffmpegPath = resolveBin("ffmpeg");
export const biliDownloaderBin = resolveBin("BBDown");
export const m3u8DownloaderBin = resolveBin("N_m3u8DL-RE");
export const gopeedBin = resolveBin("gopeed");
export const binMap = {
  [DownloadType.bilibili]: biliDownloaderBin,
  [DownloadType.m3u8]: m3u8DownloaderBin,
  [DownloadType.direct]: gopeedBin,
};

// plugin path
export const pluginPath = resolveStatic("plugin/index.js");
// mobile path
export const mobileDir = resolveStatic("mobile");

// user agent
export const pcUA = "";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
