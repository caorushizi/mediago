import { type PlatformApi } from "@mediago/shared-common";
import { isWeb } from "@/utils";
import { electronPlatformAdapter, electronIpcAdapter } from "./electron";
import { webPlatformStubs } from "./platform-stubs";
import type { IpcListener } from "./utils";

// ============================================================
// Platform adapter (Electron IPC or web stubs)
// ============================================================

/**
 * Platform adapter: Electron-native operations in desktop mode,
 * no-op stubs in web/server mode.
 */
export const platformApi: PlatformApi = isWeb
  ? webPlatformStubs
  : electronPlatformAdapter;

/**
 * Electron IPC event listener (pure platform events only).
 * Go SSE events are handled separately by api/events.ts.
 */
export const platformEventListener: IpcListener = isWeb
  ? { addIpcListener: () => {}, removeIpcListener: () => {} }
  : electronIpcAdapter;

export type { IpcListener } from "./utils";
