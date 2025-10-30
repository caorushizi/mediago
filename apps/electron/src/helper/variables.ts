import { resolve } from "node:path";
import { app } from "electron";

export const appData = app.getPath("appData");
export const download = app.getPath("downloads");
export const exePath = app.getPath("userData");

export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux",
}

export const isMac = process.platform === Platform.MacOS;
export const isWin = process.platform === Platform.Windows;
export const isLinux = process.platform === Platform.Linux;

export const appName = process.env.APP_NAME || "mediago";
export const workspace = resolve(appData, appName);
export const defaultScheme = "mediago";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const PRIVACY_WEBVIEW = "webview";
export const db = resolve(workspace, "app.db");
export const logDir = resolve(workspace, "logs");

// user agent
export const pcUA = "";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
