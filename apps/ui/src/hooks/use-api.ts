import type { GoApi, MediaGoApi, PlatformApi } from "@mediago/shared-common";
import {
  getGoApi,
  platformApi,
  type IpcListener,
  ipcAdapter,
} from "./adapters";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/** All GoApi method names — used to create lazy wrappers */
const GO_API_KEYS: (keyof GoApi)[] = [
  "getEnvPath",
  "getFavorites",
  "addFavorite",
  "removeFavorite",
  "getAppStore",
  "setAppStore",
  "createDownloadTasks",
  "getDownloadTasks",
  "startDownload",
  "stopDownload",
  "deleteDownloadTask",
  "updateDownloadTask",
  "getVideoFolders",
  "getDownloadLog",
  "getConversions",
  "addConversion",
  "deleteConversion",
  "getPageTitle",
  "setupAuth",
  "signin",
  "isSetup",
  "openUrl",
];

/**
 * Unwrap { code, data, message } response, handle 401 redirect.
 */
function unwrapResponse(result: any, navigate: ReturnType<typeof useNavigate>) {
  if (!result) return null;
  if (typeof result === "object" && "code" in result) {
    const { code, data, message } = result;
    if (code !== 0) {
      if (code === 401) {
        navigate("/signin");
      }
      return Promise.reject(new Error(message));
    }
    return data;
  }
  return result;
}

/**
 * React hook that provides unified access to both GoApi and PlatformApi.
 * GoApi methods go to Go Core HTTP; PlatformApi methods go to Electron IPC (or stubs).
 *
 * GoApi methods are resolved lazily — getGoApi() is called at invocation time,
 * not at hook initialization time. This allows useAPI() to be called before
 * initGoAdapter() completes (e.g., in App.tsx).
 */
export default function useAPI(): MediaGoApi & IpcListener {
  const navigate = useNavigate();

  const api = useMemo(() => {
    const result: Record<string, any> = {};

    // GoApi: create lazy wrappers that resolve getGoApi() at call time
    for (const key of GO_API_KEYS) {
      result[key] = async (...args: any[]) => {
        const goApi = getGoApi();
        const fn = goApi[key] as (...a: any[]) => Promise<any>;
        const res = await fn(...args);
        return unwrapResponse(res, navigate);
      };
    }

    // PlatformApi: wrap directly (always available)
    const eventMethods = new Set(["rendererEvent", "removeEventListener"]);
    for (const key of Object.keys(platformApi) as (keyof PlatformApi)[]) {
      const fn = platformApi[key];
      if (typeof fn === "function") {
        if (eventMethods.has(key)) {
          result[key] = fn;
        } else {
          result[key] = async (...args: any[]) => {
            const res = await (fn as any)(...args);
            return unwrapResponse(res, navigate);
          };
        }
      }
    }

    return result;
  }, []);

  return {
    ...api,
    ...ipcAdapter,
  } as MediaGoApi & IpcListener;
}
