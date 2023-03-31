import { nanoid } from "nanoid";

const eventFun = ["rendererEvent", "removeEventListener"];
const eventMap = new Map();

const electronApi = Object.keys(window.electron).reduce<any>((res, funName) => {
  const fun = async (...args: any[]) => {
    const electronFun = (window.electron as any)[funName];
    if (eventFun.includes(funName)) {
      const [eventName, func = {}] = args;
      let id = "";
      if (eventMap.get(func)) {
        id = eventMap.get(func);
      } else {
        id = nanoid();
        eventMap.set(func, id);
      }

      return electronFun(eventName, id, func);
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

export default function useElectron(): ElectronAPI {
  return electronApi;
}
