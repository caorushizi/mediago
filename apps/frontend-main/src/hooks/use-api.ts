import type { ElectronApi } from "@mediago/shared-common";
import { apiAdapter, type IpcListener, ipcAdapter } from "./adapters";

const eventFun = ["rendererEvent", "removeEventListener"];

const api = Object.keys(apiAdapter).reduce<any>((res, funName) => {
  const fun = async (...args: any[]) => {
    if (!apiAdapter[funName as keyof ElectronApi]) {
      return null;
    }

    const adapterFun: any = apiAdapter[funName as keyof ElectronApi];
    if (eventFun.includes(String(funName))) {
      return null;
    }

    console.info(`[useAPI] ${String(funName)} called with`, args);
    const { code, data, message } = await adapterFun(...args);
    console.info(`[useAPI] ${String(funName)} return`, {
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

export default function useAPI(): ElectronApi & IpcListener {
  return {
    ...api,
    ...ipcAdapter,
  };
}
