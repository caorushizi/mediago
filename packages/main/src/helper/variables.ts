import { app } from "electron";
import isDev from "electron-is-dev";
import { resolve } from "path";

const appPath = app.getAppPath();
export const appData = app.getPath("appData");
export const download = app.getPath("downloads");

if (!isDev) {
  global.__bin__ = resolve(appPath, "../bin");
}

export const appName = process.env.APP_NAME || "electron-template";
export const workspace = resolve(appData, appName);
export const defaultScheme = "mediago";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const db = resolve(workspace, "app.db");

// bin path
export const ffmpegPath = resolve(__bin__, "ffmpeg");
export const biliDownloaderBin = resolve(__bin__, "BBDown");
export const m3u8DownloaderBin =
  process.platform === "win32"
    ? resolve(__bin__, "N_m3u8DL-CLI")
    : resolve(__bin__, "N_m3u8DL-RE");

// mobile path
export const mobilePath = resolve(
  appPath,
  isDev ? "../../mobile" : "../mobile"
);

// user agent
export const pcUA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36";
