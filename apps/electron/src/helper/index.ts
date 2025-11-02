import { spawn } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { LRUCache } from "lru-cache";
import { loadModule } from "@mediago/shared-node";
import path from "node:path";

const ffmpegModule = loadModule("@mediago/deps");
export const ffmpegPath = path.resolve(
  path.dirname(ffmpegModule),
  "bin",
  "ffmpeg",
);

export * from "./variables";
export { error, type IpcResponse, success } from "./ipcResponse";

export function noop() {}

const options: LRUCache.OptionsMaxLimit<string, boolean, unknown> = {
  max: 5000,

  // how long to live in ms
  ttl: 1000 * 60 * 5,
};

export const urlCache = new LRUCache(options);

export async function sleep(second = 1): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

export function formatHeaders(headers: Record<string, string>): string {
  if (!headers) return "";
  const formatted = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join("\n");
  return formatted;
}

export const event = new EventEmitter();

// Determine whether it is a function of deeplink
export function isDeeplink(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:";
  } catch {
    return false;
  }
}

/**
 * from url get file extension
 * @param url URL string
 * @returns string file extension (without dot), if no extension returns empty string
 */
export function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split(".").pop() || "";
    return extension.toLowerCase();
  } catch {
    return "";
  }
}

export function fileExists(path: string): Promise<boolean> {
  return fs
    .access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const convertToAudio = async (
  input: string,
  output: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-v",
      "error",
      "-i",
      input,
      "-acodec",
      "mp3",
      "-format",
      "mp3",
      output,
    ]);
    let errData = "";

    ffmpeg.stderr.on("data", (data) => {
      errData += String(data);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(errData));
      }
    });
  });
};

const require = createRequire(import.meta.url);
export const preloadUrl = require.resolve("@mediago/electron-preload");
export const pluginUrl = require.resolve("@mediago/browser-extension");
