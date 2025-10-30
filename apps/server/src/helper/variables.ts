import os from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const API_PREFIX = "/api";
export const HOME_DIR = os.homedir();
export const DOWNLOAD_DIR = `${HOME_DIR}/mediago`;
export const STATIC_DIR = resolve(__dirname, "../frontend");
export const BIN_DIR = resolve(__dirname, "./bin");
export const WORKSPACE = `${DOWNLOAD_DIR}/.store`;
export const DB_PATH = `${WORKSPACE}/mediago.db`;
export const LOG_DIR = `${WORKSPACE}/logs`;

export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux",
}

export const isMac = process.platform === Platform.MacOS;
export const isWin = process.platform === Platform.Windows;
export const isLinux = process.platform === Platform.Linux;

export const appName = process.env.APP_NAME || "mediago";
export const defaultScheme = "mediago";
export const PERSIST_MEDIAGO = "persist:mediago";
export const PERSIST_WEBVIEW = "persist:webview";
export const PRIVACY_WEBVIEW = "webview";

// user agent
export const pcUA = "";
export const mobileUA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
