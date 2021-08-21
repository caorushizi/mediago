import { app } from "electron";
import { is } from "electron-util";
import path from "path";

export const appData = app.getPath("appData");
export const appName = is.development
  ? "media downloader dev"
  : "media downloader";
export const workspace = path.resolve(appData, appName);
export const webviewPartition = "persist:mediago";
export const defaultScheme = "mediago";
