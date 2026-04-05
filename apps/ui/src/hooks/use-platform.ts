import { useMemo } from "react";
import {
  platformApi,
  platformEventListener,
  type IpcListener,
} from "./adapters";
import type { PlatformApi } from "@mediago/shared-common";

/**
 * Unwrap IPC response: { code, data, msg } → data
 */
function unwrapIpcResult(result: unknown): unknown {
  if (result && typeof result === "object" && "code" in result) {
    return (result as Record<string, unknown>).data;
  }
  return result;
}

/**
 * Shallow-copy an object so we get a plain, configurable target
 * (contextBridge objects are frozen / non-configurable).
 */
function shallowCopy(obj: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    copy[key] = obj[key];
  }
  return copy;
}

/**
 * Create a recursive Proxy that auto-unwraps IPC results for nested objects.
 * Namespace objects (browser, app, dialog, etc.) return sub-proxies.
 * Function properties are wrapped to auto-unwrap {code,data,msg} responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createUnwrapProxy(source: Record<string, unknown>): any {
  const target = shallowCopy(source);
  const cache = new Map<string, unknown>();
  return new Proxy(target, {
    get(_t, prop: string) {
      if (cache.has(prop)) return cache.get(prop);

      const val = target[prop];
      if (val == null) return val;

      if (typeof val === "object" && !Array.isArray(val)) {
        // Namespace object — recurse
        const sub = createUnwrapProxy(val as Record<string, unknown>);
        cache.set(prop, sub);
        return sub;
      }
      if (typeof val === "function") {
        const wrapped = async (...args: unknown[]) => {
          const result = await (val as (...a: unknown[]) => Promise<unknown>)(
            ...args,
          );
          return unwrapIpcResult(result);
        };
        cache.set(prop, wrapped);
        return wrapped;
      }
      return val;
    },
  });
}

/**
 * Provides Electron IPC methods + platform event listeners.
 * Non-SWR hook for imperative platform interactions.
 *
 * All PlatformApi method return values are auto-unwrapped from
 * { code, data, msg } → data, matching the old useAPI() behavior.
 *
 * Go SSE events (download/config) are handled separately by api/events.ts.
 */
export function usePlatform(): PlatformApi & IpcListener {
  return useMemo(() => {
    const unwrapped = createUnwrapProxy(
      platformApi as unknown as Record<string, unknown>,
    );

    // Attach event listener methods directly
    unwrapped.on = platformEventListener.on;
    unwrapped.off = platformEventListener.off;

    return unwrapped as PlatformApi & IpcListener;
  }, []);
}

export type { IpcListener };
