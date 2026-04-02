import { useMemo } from "react";
import {
  platformApi,
  platformEventListener,
  type IpcListener,
} from "./adapters";

/**
 * Provides Electron IPC methods + platform event listeners.
 * Non-SWR hook for imperative platform interactions.
 *
 * Note: platformApi may be a Proxy (Electron mode), so we cannot spread it.
 * Instead we return it directly and let consumers access methods by name.
 *
 * Go SSE events (download/config) are handled separately by api/events.ts.
 */
export function usePlatform() {
  return useMemo(() => {
    // Proxy objects cannot be spread — create a wrapper that delegates
    // property access to platformApi first, then platformEventListener
    return new Proxy({} as typeof platformApi & IpcListener, {
      get(_target, prop: string) {
        // Event listener methods
        if (prop === "addIpcListener")
          return platformEventListener.addIpcListener;
        if (prop === "removeIpcListener")
          return platformEventListener.removeIpcListener;
        // Platform API methods (may be Proxy in Electron mode)
        // eslint-disable-next-line -- platformApi is a Proxy, typed access not possible
        const val = (platformApi as Record<string, unknown>)[prop];
        if (val !== undefined) return val;
        return undefined;
      },
    });
  }, []);
}

export type { IpcListener };
