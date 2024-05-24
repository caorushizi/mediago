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
export const db = resolve(workspace, "app.db");

// bin path
const downloaderBinName = isWin ? "N_m3u8DL-CLI" : "N_m3u8DL-RE";
export const ffmpegPath = resolveBin("ffmpeg");
export const biliDownloaderBin = resolveBin("BBDown");
export const m3u8DownloaderBin = resolveBin(downloaderBinName);
export const videoServerBin = resolveBin("server");

// plugin path
export const pluginPath = resolveStatic("plugin/index.js");

// user agent
export const pcUA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36";
