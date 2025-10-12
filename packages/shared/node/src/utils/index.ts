import os from "node:os";
import { MEDIAGO_EVENT, MEDIAGO_METHOD } from "@mediago/shared-common";
import portfinder, { type PortFinderOptions } from "portfinder";

export type { ControllerHandlerBinder, ControllerHandlerRegistration } from "./registerControllerHandlers";
export { registerControllerHandlers } from "./registerControllerHandlers";
export const handle = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata(MEDIAGO_METHOD, "handle", target, propertyName);
    Reflect.defineMetadata(MEDIAGO_EVENT, route, target, propertyName);
  };
};

export { ServiceRunner } from "./service-runner";

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

export const findFreePort = async (opts: PortFinderOptions): Promise<number> => {
  return portfinder.getPortPromise(opts);
};
