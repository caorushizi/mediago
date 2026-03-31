import type { GoApi, MediaGoApi, PlatformApi } from "@mediago/shared-common";
import {
  getGoApi,
  platformApi,
  type IpcListener,
  ipcAdapter,
} from "./adapters";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Wraps a GoApi method to unwrap { code, data, message } responses,
 * handle 401 redirects, and reject on non-zero codes.
 */
function wrapApiMethod(
  fn: (...args: any[]) => Promise<any>,
  navigate: ReturnType<typeof useNavigate>,
) {
  return async (...args: any[]) => {
    const result = await fn(...args);
    if (!result) return null;
    const { code, data, message } = result;
    if (code !== 0) {
      if (code === 401) {
        navigate("/signin");
      }
      return Promise.reject(new Error(message));
    }
    return data;
  };
}

/**
 * Wraps a PlatformApi method with the same response unwrapping.
 * Platform methods may return raw IPC responses ({ code, data, message })
 * or direct values depending on the method.
 */
function wrapPlatformMethod(
  fn: (...args: any[]) => any,
  navigate: ReturnType<typeof useNavigate>,
) {
  return async (...args: any[]) => {
    const result = await fn(...args);
    if (!result) return null;
    // Platform responses from Electron IPC are wrapped in { code, data, message }
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
    // Some methods return direct values (e.g., openBrowser returns void)
    return result;
  };
}

/**
 * React hook that provides unified access to both GoApi and PlatformApi.
 * GoApi methods go to Go Core HTTP; PlatformApi methods go to Electron IPC (or stubs).
 */
export default function useAPI(): MediaGoApi & IpcListener {
  const navigate = useNavigate();

  const api = useMemo(() => {
    // Wrap GoApi methods
    const goApi = getGoApi();
    const wrappedGo: Record<string, any> = {};
    for (const key of Object.keys(goApi) as (keyof GoApi)[]) {
      const fn = goApi[key];
      if (typeof fn === "function") {
        wrappedGo[key] = wrapApiMethod(fn as any, navigate);
      }
    }

    // Wrap PlatformApi methods (skip event listener methods — they're sync)
    const eventMethods = new Set(["rendererEvent", "removeEventListener"]);
    const wrappedPlatform: Record<string, any> = {};
    for (const key of Object.keys(platformApi) as (keyof PlatformApi)[]) {
      const fn = platformApi[key];
      if (typeof fn === "function") {
        if (eventMethods.has(key)) {
          wrappedPlatform[key] = fn;
        } else {
          wrappedPlatform[key] = wrapPlatformMethod(fn as any, navigate);
        }
      }
    }

    return { ...wrappedGo, ...wrappedPlatform };
  }, []);

  return {
    ...api,
    ...ipcAdapter,
  } as MediaGoApi & IpcListener;
}
