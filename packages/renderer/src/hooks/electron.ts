import { nanoid } from "nanoid";
import { ElectronApi } from "../../../main/types/preload";

const eventFun = ["rendererEvent", "removeEventListener"];
const eventMap = new Map();

const api = Object.keys(window.electron || {}).reduce<any>((res, funName) => {
  const fun = async (...args: any[]) => {
    if (!window.electron[funName]) {
      return null;
    }

    const electronFun: any = window.electron[funName];
    if (eventFun.includes(String(funName))) {
      return null;
    }

    const { code, data, message } = await electronFun(...args);
    if (code !== 0) {
      return Promise.reject(new Error(message));
    }
    return data;
  };
  res[funName] = fun;
  return res;
}, {});

interface IpcListener {
  addIpcListener: (eventName: string, func: any) => void;
  removeIpcListener: (eventName: string, func: any) => void;
}

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

export default function useElectron(): ElectronApi & IpcListener {
  return {
    ...api,
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
}
