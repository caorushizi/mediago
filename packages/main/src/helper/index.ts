import os from "os";
import fetch from "node-fetch";
import https from "https";

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = "";

  // Traverse the network interface
  for (const key in interfaces) {
    const iface = interfaces[key];
    if (!iface) continue;

    // IPv4 addresses that are not loopback addresses are filtered out
    const filteredIface = iface.filter(
      (details) => details.family === "IPv4" && !details.internal,
    );

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

export { sleep, formatHeaders } from "./utils.ts";
export * from "./variables.ts";
export { on, handle } from "./decorator.ts";
export { convertToAudio } from "./ffmpeg.ts";
export { fetchWrapper as fetch };
export { fileExists } from "./file.ts";
export { videoPattern } from "./video.ts";
export { urlCache } from "./cache.ts";
