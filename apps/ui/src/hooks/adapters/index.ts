import {
  DOWNLOAD_EVENT_NAME,
  type GoApi,
  type PlatformApi,
} from "@mediago/shared-common";
import { isWeb } from "@/utils";
import { useAppStore } from "@/store/app";
import { electronPlatformAdapter, electronIpcAdapter } from "./electron";
import { webPlatformStubs } from "./platform-stubs";
import { createGoAdapter, type GoAdapterHandle } from "./go-adapter";
import { createGoEventBridge } from "./go-event-bridge";
import type { IpcListener } from "./utils";

// ============================================================
// Go Core adapter (data/CRUD operations via HTTP)
// ============================================================

let goHandle: GoAdapterHandle | null = null;
let goEventBridge:
  | (IpcListener & {
      startPolling: () => void;
      close: () => void;
    })
  | null = null;

/**
 * Get the Go API adapter. Throws if not initialized yet.
 * Components should only call this after adapterReady=true.
 */
export function getGoApi(): GoApi {
  if (!goHandle) {
    throw new Error(
      "Go adapter not initialized. Ensure initGoAdapter() was called.",
    );
  }
  return goHandle.adapter as GoApi;
}

/**
 * Initialize Go Core adapter and SSE event bridge.
 */
export function initGoAdapter(coreUrl: string, apiKey?: string) {
  goHandle = createGoAdapter(
    coreUrl,
    () => {
      const s = useAppStore.getState();
      return { local: s.local, deleteSegments: s.deleteSegments };
    },
    apiKey,
  );
  goEventBridge = createGoEventBridge(coreUrl, apiKey);

  // Check on init whether there are already active downloads
  goEventBridge.startPolling();
}

/**
 * Update the API key on the Go adapter (e.g., after signin).
 */
export function setGoApiKey(key: string) {
  if (goHandle) {
    goHandle.setApiKey(key);
  }
}

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

const platformIpcAdapter: IpcListener = isWeb
  ? { addIpcListener: () => {}, removeIpcListener: () => {} }
  : electronIpcAdapter;

// ============================================================
// Event adapter (routes SSE events vs platform IPC events)
// ============================================================

/** Go SSE events routed through EventBridge, not platform IPC */
const GO_EVENTS = new Set<string>([DOWNLOAD_EVENT_NAME, "config-changed"]);

export const ipcAdapter: IpcListener = {
  addIpcListener(channel: string, fn: any) {
    if (GO_EVENTS.has(channel) && goEventBridge) {
      goEventBridge.addIpcListener(channel, fn);
    } else {
      platformIpcAdapter.addIpcListener(channel, fn);
    }
  },
  removeIpcListener(channel: string, fn: any) {
    if (GO_EVENTS.has(channel) && goEventBridge) {
      goEventBridge.removeIpcListener(channel, fn);
    } else {
      platformIpcAdapter.removeIpcListener(channel, fn);
    }
  },
};

export type { IpcListener } from "./utils";
