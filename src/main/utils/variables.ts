import { app } from "electron";
import path, { resolve } from "path";

declare const __bin__: string;

if (process.env.NODE_ENV !== "development") {
  global.__bin__ = resolve(app.getAppPath(), "../.bin").replace(/\\/g, "\\\\");
}

export const appData = app.getPath("appData");
export const appName =
  process.env.NODE_ENV === "development"
    ? "media downloader dev"
    : "media downloader";
export const workspace = path.resolve(appData, appName);
export const webviewPartition = "persist:mediago";
export const defaultScheme = "mediago";

export enum Windows {
  MAIN_WINDOW = "MAIN_WINDOW",
  BROWSER_WINDOW = "BROWSER_WINDOW",
}

export const binDir = __bin__;
