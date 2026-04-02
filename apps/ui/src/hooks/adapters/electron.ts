import type { PlatformApi } from "@mediago/shared-common";
import { getIpcId, type IpcListener } from "./utils";

/**
 * Electron platform adapter.
 * Only exposes PlatformApi methods (those with real IPC handlers).
 * GoApi methods go directly to Go Core HTTP — never through IPC.
 */
export const electronPlatformAdapter: PlatformApi = new Proxy(
  {} as PlatformApi,
  {
    get(_target, prop: string) {
      if (!window.electron || !(prop in window.electron)) {
        return async () => ({
          code: -1,
          msg: `Method '${prop}' not implemented`,
          data: null as unknown,
        });
      }

      const electronFun = window.electron[prop as keyof typeof window.electron];
      if (typeof electronFun !== "function") {
        return async () => ({
          code: -1,
          msg: `Property '${prop}' is not callable`,
          data: null as unknown,
        });
      }

      return electronFun.bind(window.electron);
    },
  },
);

/**
 * Electron IPC event adapter.
 */
export const electronIpcAdapter: IpcListener = {
  addIpcListener: (eventName: string, func: any) => {
    const id = getIpcId(func);
    if (!window.electron || !window.electron.rendererEvent) {
      return;
    }
    window.electron.rendererEvent(eventName, id, func);
  },
  removeIpcListener: (eventName: string, func: any) => {
    const id = getIpcId(func);
    if (!window.electron || !window.electron.removeEventListener) {
      return;
    }
    window.electron.removeEventListener(eventName, id);
  },
};
