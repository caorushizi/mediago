import { nanoid } from "nanoid";
import { ElectronApi } from "@mediago/shared/common";
import apis from "@/apis";
import { isWeb } from "@/utils";
import { getSocket } from "@/utils";

const eventFun = ["rendererEvent", "removeEventListener"];
const eventMap = new Map();

const apiFun = (isWeb ? apis : window.electron) || {};

const api = Object.keys(apiFun).reduce<any>((res, funName) => {
  const fun = async (...args: any[]) => {
    if (!apiFun[funName]) {
      return null;
    }

    const electronFun: any = apiFun[funName];
    if (eventFun.includes(String(funName))) {
      return null;
    }

    console.info(`[useElectron] ${String(funName)} called with`, args);
    const { code, data, message } = await electronFun(...args);
    console.info(`[useElectron] ${String(funName)} return`, {
      code,
      data,
      message,
    });
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

const ipc = isWeb
  ? {
      addIpcListener: (event: string, func: any) => {
        const socket = getSocket();
        socket.on(event, func);
      },
      removeIpcListener: (event: string, func: any) => {
        const socket = getSocket();
        socket.off(event, func);
      },
    }
  : {
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

export default function useElectron(): ElectronApi & IpcListener {
  return {
    ...api,
    ...ipc,
  };
}
