import type { MediaGoApi } from "@mediago/shared-common";
import { apiAdapter, type IpcListener, ipcAdapter } from "./adapters";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const eventFun = ["rendererEvent", "removeEventListener"];

export default function useAPI(): MediaGoApi & IpcListener {
  const navigate = useNavigate();

  const api = useMemo(() => {
    return Object.keys(apiAdapter).reduce<any>((res, funName) => {
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
          if (code === 401) {
            navigate("/signin");
          }
          return Promise.reject(new Error(message));
        }
        return data;
      };
      res[funName] = fun;
      return res;
    }, {});
  }, []);

  return {
    ...api,
    ...ipcAdapter,
  };
}
