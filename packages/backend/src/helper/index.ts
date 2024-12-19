import os from "os";

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

export { sleep, formatHeaders } from "./utils.ts";
export * from "./variables.ts";
export { get, post } from "./decorator.ts";
export { convertToAudio } from "./ffmpeg.ts";
