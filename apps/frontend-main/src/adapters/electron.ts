import type { ElectronApi } from "@mediago/shared/common";
import { nanoid } from "nanoid";

interface IpcListener {
  addIpcListener: (eventName: string, func: any) => void;
  removeIpcListener: (eventName: string, func: any) => void;
}

const eventMap = new Map();

const getIpcId = (func: any) => {
  let id = "";
  if (eventMap.get(func)) {
    id = eventMap.get(func);
  } else {
    id = nanoid();
    eventMap.set(func, id);
  }
  return id;
};

/**
 * Electron 环境适配器
 * 直接使用 window.electron API
 */
export const electronAdapter: ElectronApi = new Proxy({} as ElectronApi, {
  get(_target, prop: string) {
    if (!window.electron || !(prop in window.electron)) {
      console.warn(`[ElectronAdapter] Method '${prop}' not available in Electron context`);
      return async () => ({ code: -1, msg: `Method '${prop}' not implemented`, data: null });
    }

    const electronFun = window.electron[prop as keyof typeof window.electron];
    if (typeof electronFun !== 'function') {
      console.warn(`[ElectronAdapter] Property '${prop}' is not a function`);
      return async () => ({ code: -1, msg: `Property '${prop}' is not callable`, data: null });
    }

    return electronFun.bind(window.electron);
  }
});

/**
 * Electron 环境 IPC 适配器
 * 使用 Electron 的 IPC 通信
 */
export const electronIpcAdapter: IpcListener = {
  addIpcListener: (eventName: string, func: any) => {
    const id = getIpcId(func);
    if (!window.electron || !window.electron.rendererEvent) {
      console.warn("[ElectronIpcAdapter] window.electron.rendererEvent not available");
      return;
    }
    window.electron.rendererEvent(eventName, id, func);
  },
  removeIpcListener: (eventName: string, func: any) => {
    const id = getIpcId(func);
    if (!window.electron || !window.electron.removeEventListener) {
      console.warn("[ElectronIpcAdapter] window.electron.removeEventListener not available");
      return;
    }
    window.electron.removeEventListener(eventName, id);
  },
};

export type { IpcListener };