import { useMemo } from "react";
import {
  platformApi,
  platformEventListener,
  type IpcListener,
} from "./adapters";

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
 * Provides Electron IPC methods + platform event listeners.
 * Non-SWR hook for imperative platform interactions.
 *
 * All PlatformApi method return values are auto-unwrapped from
 * { code, data, msg } → data, matching the old useAPI() behavior.
 *
 * Go SSE events (download/config) are handled separately by api/events.ts.
 */
export function usePlatform() {
  return useMemo(() => {
    return new Proxy({} as typeof platformApi & IpcListener, {
      get(_target, prop: string) {
        // Event listener methods (no unwrap needed)
        if (prop === "addIpcListener")
          return platformEventListener.addIpcListener;
        if (prop === "removeIpcListener")
          return platformEventListener.removeIpcListener;

        // Platform API methods — wrap to auto-unwrap IPC responses
        const val = (platformApi as Record<string, unknown>)[prop];
        if (typeof val === "function") {
          return async (...args: unknown[]) => {
            const result = await (val as (...a: unknown[]) => Promise<unknown>)(
              ...args,
            );
            return unwrapIpcResult(result);
          };
        }
        return val;
      },
    });
  }, []);
}

export type { IpcListener };
