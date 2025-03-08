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
export const DB_PATH = `${DOWNLOAD_DIR}/.store/mediago.db`;
