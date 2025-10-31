import os from "node:os";
import { MEDIAGO_EVENT, MEDIAGO_METHOD } from "@mediago/shared-common";
import axios from "axios";
import { customAlphabet } from "nanoid";
import dayjs from "dayjs";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export type {
  ControllerHandlerBinder,
  ControllerHandlerRegistration,
} from "./registerControllerHandlers";
export { registerControllerHandlers } from "./registerControllerHandlers";
export const handle = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata(MEDIAGO_METHOD, "handle", target, propertyName);
    Reflect.defineMetadata(MEDIAGO_EVENT, route, target, propertyName);
  };
};

export function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
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

export function loadModule(moduleName: string) {
  try {
    let bin = require.resolve(moduleName);
    if (
      process.env.NODE_ENV === "production" &&
      process.env.APP_TARGET === "electron"
    ) {
      bin = bin.replace("app.asar", "app.asar.unpacked");
    }
    return bin;
  } catch {
    return "";
  }
}

export async function getPageTitle(
  url: string,
  fallbackTitle = randomName(),
): Promise<string> {
  const response = await axios.get<string>(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {},
  });

  const html = response.data ?? "";
  return extractTitle(html, fallbackTitle);
}

export function extractTitle(html: string, fallbackTitle: string): string {
  if (!html) {
    return fallbackTitle;
  }

  const patterns = [
    /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
    /<meta\s+name=["']title["']\s+content=["']([^"']*)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return fallbackTitle;
}

export function randomName() {
  return dayjs().format("YYYYMMDD") + "-" + nanoid();
}
