import { DownloadType } from "@mediago/shared/common";
import os from "os";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const API_PREFIX = "/api";
export const HOME_DIR = os.homedir();
export const DOWNLOAD_DIR = `${HOME_DIR}/mediago`;
export const STATIC_DIR = resolve(__dirname, "../app");
export const BIN_DIR = resolve(__dirname, "./bin");
export const WORKSPACE = `${DOWNLOAD_DIR}/.store`;
export const DB_PATH = `${WORKSPACE}/mediago.db`;

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
export const gopeedBin = resolveBin("gopeed");

// user agent
export const pcUA = "";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";

export const binMap = {
  [DownloadType.bilibili]: biliDownloaderBin,
  [DownloadType.m3u8]: m3u8DownloaderBin,
  [DownloadType.direct]: gopeedBin,
};
