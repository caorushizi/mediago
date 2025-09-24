import fs from "node:fs/promises";
import https from "node:https";
import os from "node:os";
import { spawn } from "child_process";
import EventEmitter from "events";
import { LRUCache } from "lru-cache";
import fetch from "node-fetch";
import { ffmpegPath } from "./variables";

export * from "./variables";
export { fetchWrapper as fetch };
export { type IpcResponse, success, error } from "./ipcResponse";

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = "";

  // Traverse the network interface
  for (const key in interfaces) {
    const iface = interfaces[key];
    if (!iface) continue;

    // IPv4 addresses that are not loopback addresses are filtered out
    const filteredIface = iface.filter((details) => details.family === "IPv4" && !details.internal);

    if (filteredIface.length > 0) {
      localIP = filteredIface[0].address;
      break;
    }
  }

  return localIP;
}

function fetchWrapper(url: string) {
  const options = {
    agent: new https.Agent({
      rejectUnauthorized: false,
    }),
  };
  return fetch(url, options);
}

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
  } catch (error) {
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

export const videoType = [
  "mp4",
  "flv",
  "avi",
  "rmvb",
  "wmv",
  "mov",
  "mkv",
  "webm",
  "mpeg",
  "mpg",
  "m4v",
  "3gp",
  "3g2",
  "f4v",
  "f4p",
  "f4a",
  "f4b",
];

export const videoPattern = videoType.join(",");

export const convertToAudio = async (input: string, output: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, ["-y", "-v", "error", "-i", input, "-acodec", "mp3", "-format", "mp3", output]);
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
