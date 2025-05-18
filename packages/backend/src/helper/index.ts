import os from "os";
import { spawn } from "child_process";
import { ffmpegPath } from "./variables.ts";
import EventEmitter from "events";

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

export interface IpcResponse {
  code: number;
  message: string;
  data: Record<string, any> | null;
}

export function success(data: Record<string, any>): IpcResponse {
  return {
    code: 0,
    message: "success",
    data,
  };
}

export function error(message = "fail"): IpcResponse {
  return {
    code: -1,
    message,
    data: null,
  };
}

export const convertToAudio = async (
  input: string,
  output: string
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

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = "";

  // Traverse the network interface
  for (const key in interfaces) {
    const iface = interfaces[key];
    if (!iface) continue;

    // IPv4 addresses that are not loopback addresses are filtered out
    const filteredIface = iface.filter(
      (details) => details.family === "IPv4" && !details.internal
    );

    if (filteredIface.length > 0) {
      localIP = filteredIface[0].address;
      break;
    }
  }

  return localIP;
}

export * from "./variables.ts";

export const get = (route: string) => {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata("http-method", "get", target, propertyKey);
    Reflect.defineMetadata("router-path", route, target, propertyKey);
  };
};

export const post = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata("http-method", "post", target, propertyName);
    Reflect.defineMetadata("router-path", route, target, propertyName);
  };
};
