import type { PlatformApi } from "@mediago/shared-common";

/**
 * Electron platform adapter.
 * Simply delegates to window.electron which exposes the nested PlatformApi.
 */
export const electronPlatformAdapter: PlatformApi =
  (window.electron as PlatformApi) ?? ({} as PlatformApi);

/**
 * Electron IPC event adapter — uses on/off from window.electron.
 */
export const electronIpcAdapter = {
  on: (eventName: string, func: (...args: unknown[]) => void) => {
    window.electron?.on?.(eventName, func);
  },
  off: (eventName: string, func: (...args: unknown[]) => void) => {
    window.electron?.off?.(eventName, func);
  },
};
