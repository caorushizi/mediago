import { app } from "electron";
import isDev from "electron-is-dev";
import path from "path";

export const appData = app.getPath("appData");
export const appName = process.env.APP_NAME || "electron-template";
export const workspace = path.resolve(appData, appName);
export const defaultScheme = "mediago";
export const download = app.getPath("downloads");
export const MAIN_WINDOW = "MAIN_WINDOW";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const db = path.resolve(workspace, "app.db");

if (!isDev) {
  global.__bin__ = path.resolve(app.getAppPath(), "../bin");
}
