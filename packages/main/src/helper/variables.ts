import { app } from "electron";
import isDev from "electron-is-dev";
import path from "path";

if (!isDev) {
  global.__bin__ = path.resolve(app.getAppPath(), "../bin");
}

export const appData = app.getPath("appData");
export const appName = process.env.APP_NAME || "electron-template";
export const workspace = path.resolve(appData, appName);
export const defaultScheme = "mediago";
export const download = app.getPath("downloads");
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const db = path.resolve(workspace, "app.db");
export const macDownloaderPath = path.resolve(__bin__, "N_m3u8DL-RE");
export const winDownloaderPath = path.resolve(
  __bin__,
  "N_m3u8DL-CLI_v3.0.2.exe"
);
export const ffmpegPath = path.resolve(__bin__, "ffmpeg.exe");
