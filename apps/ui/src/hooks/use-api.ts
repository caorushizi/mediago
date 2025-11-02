import type { MediaGoApi } from "@mediago/shared-common";
import { apiAdapter, type IpcListener, ipcAdapter } from "./adapters";

const eventFun = ["rendererEvent", "removeEventListener"];

const api = Object.keys(apiAdapter).reduce<any>((res, funName) => {
  const fun = async (...args: any[]) => {
    if (!apiAdapter[funName as keyof MediaGoApi]) {
      return null;
    }

    const adapterFun: any = apiAdapter[funName as keyof MediaGoApi];
    if (eventFun.includes(String(funName))) {
      return null;
    }

    const { code, data, message } = await adapterFun(...args);
    if (code !== 0) {
      return Promise.reject(new Error(message));
    }
    return data;
  };
  res[funName] = fun;
  return res;
}, {});

export default function useAPI(): MediaGoApi & IpcListener {
  return {
    ...api,
    ...ipcAdapter,
  };
}
