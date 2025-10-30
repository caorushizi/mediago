import os from "node:os";
import { MEDIAGO_EVENT, MEDIAGO_METHOD } from "@mediago/shared-common";

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
    if (process.env.NODE_ENV === "production") {
      bin = bin.replace("app.asar", "app.asar.unpacked");
    }
    return bin;
  } catch {
    return "";
  }
}
