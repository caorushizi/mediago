import os from "os";

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = "";

  // 遍历网络接口
  for (const key in interfaces) {
    const iface = interfaces[key];
    if (!iface) continue;

    // 过滤出 IPv4 地址且非回环地址
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
