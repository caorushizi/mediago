import type { ElectronApi } from "@mediago/shared-common";
import { getIpcId, IpcListener } from "./utils";

/**
 * 获取所有可用的 API 方法名
 * 从 window.electron 或者预定义的方法列表中获取
 */
const getAvailableApiMethods = (): string[] => {
  if (!window.electron) {
    throw new Error("window.electron is not available");
  }

  return Object.keys(window.electron) as string[];
};

/**
 * Electron 环境适配器
 * 直接使用 window.electron API
 */
export const electronAdapter: ElectronApi = new Proxy({} as ElectronApi, {
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

  ownKeys(_target) {
    // 返回所有可用的 API 方法名，使 Object.keys() 能够工作
    return getAvailableApiMethods();
  },

  getOwnPropertyDescriptor(_target, prop) {
    // 返回属性描述符，使属性看起来是可枚举的
    const availableMethods = getAvailableApiMethods();
    if (availableMethods.includes(prop as string)) {
      return {
        enumerable: true,
        configurable: true,
        value: undefined, // 值会通过 get 陷阱获取
      };
    }
    return undefined;
  },
});

/**
 * Electron 环境 IPC 适配器
 * 使用 Electron 的 IPC 通信
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

export type { IpcListener };
