import { DOWNLOAD_EVENT_NAME, type MediaGoApi } from "@mediago/shared-common";
import { isWeb } from "@/utils";
import { useAppStore } from "@/store/app";
import { electronAdapter, electronIpcAdapter } from "./electron";
import { createGoAdapter, type GoAdapterHandle } from "./go-adapter";
import { createGoEventBridge } from "./go-event-bridge";
import type { IpcListener } from "./utils";

let goHandle: GoAdapterHandle | null = null;
let goEventBridge: (IpcListener & { close: () => void }) | null = null;

/**
 * All MediaGoApi method names — needed for Proxy ownKeys so that
 * Object.keys(apiAdapter) works correctly in web mode.
 */
const ALL_API_METHODS: (keyof MediaGoApi)[] = [
  "getEnvPath",
  "getFavorites",
  "addFavorite",
  "removeFavorite",
  "setWebviewBounds",
  "webviewGoBack",
  "webviewReload",
  "webviewLoadURL",
  "webviewGoHome",
  "getAppStore",
  "onSelectDownloadDir",
  "setAppStore",
  "openDir",
  "createDownloadTasks",
  "getDownloadTasks",
  "startDownload",
  "openUrl",
  "stopDownload",
  "onDownloadListContextMenu",
  "onFavoriteItemContextMenu",
  "deleteDownloadTask",
  "convertToAudio",
  "rendererEvent",
  "removeEventListener",
  "showBrowserWindow",
  "webviewHide",
  "webviewShow",
  "appContextMenu",
  "combineToHomePage",
  "updateDownloadTask",
  "getLocalIP",
  "openBrowser",
  "selectFile",
  "getSharedState",
  "setSharedState",
  "setUserAgent",
  "getDownloadLog",
  "showDownloadDialog",
  "pluginReady",
  "getConversions",
  "addConversion",
  "deleteConversion",
  "getMachineId",
  "clearWebviewCache",
  "exportFavorites",
  "importFavorites",
  "checkUpdate",
  "startUpdate",
  "installUpdate",
  "exportDownloadList",
  "getVideoFolders",
  "setupAuth",
  "signin",
  "isSetup",
  "getPageTitle",
];

/**
 * Methods handled directly by Go Core SDK
 */
const GO_METHODS = new Set<string>([
  "getFavorites",
  "addFavorite",
  "removeFavorite",
  "getDownloadTasks",
  "createDownloadTasks",
  "startDownload",
  "stopDownload",
  "deleteDownloadTask",
  "updateDownloadTask",
  "getVideoFolders",
  "getDownloadLog",
  "getConversions",
  "addConversion",
  "deleteConversion",
  "getAppStore",
  "setAppStore",
  "getPageTitle",
  "setupAuth",
  "signin",
  "isSetup",
  "getEnvPath",
  "exportFavorites",
  "importFavorites",
  "exportDownloadList",
  "openUrl",
]);

/**
 * Go SSE events routed through EventBridge, not platform IPC
 */
const GO_EVENTS = new Set<string>([DOWNLOAD_EVENT_NAME, "config-changed"]);

/**
 * Default no-op adapter for web mode before Go adapter is initialized
 */
const defaultResp = { code: 0, msg: "", data: {} } as any;

const webStubAdapter: MediaGoApi = new Proxy({} as MediaGoApi, {
  get(_target, prop: string) {
    if (prop === "then" || prop === "catch") return undefined;
    return async () => defaultResp;
  },
  ownKeys() {
    return ALL_API_METHODS;
  },
  getOwnPropertyDescriptor() {
    return { configurable: true, enumerable: true };
  },
});

/**
 * Platform adapter: Electron IPC or web stub
 * In web mode, Electron adapter is not available, so we use a stub
 * that returns default responses for Electron-only methods.
 */
const platformAdapter: MediaGoApi = isWeb ? webStubAdapter : electronAdapter;
const platformIpcAdapter: IpcListener = isWeb
  ? { addIpcListener: () => {}, removeIpcListener: () => {} }
  : electronIpcAdapter;

/**
 * Combined adapter: Go direct + platform fallback
 * Before Go adapter is initialized, all calls go to platform adapter
 */
export const apiAdapter = new Proxy(platformAdapter, {
  get(target, prop: string) {
    if (goHandle && GO_METHODS.has(prop) && prop in goHandle.adapter) {
      const goFn = (goHandle.adapter as any)[prop];
      const platformFn = (target as any)[prop];
      if (typeof goFn === "function") {
        if (typeof platformFn === "function") {
          return (...args: any[]) =>
            goFn(...args).catch((err: any) => {
              console.warn(
                `Go adapter "${prop}" failed, falling back to platform adapter:`,
                err,
              );
              return platformFn(...args);
            });
        }
        return goFn;
      }
    }
    return (target as any)[prop];
  },
  ownKeys(target) {
    const keys = new Set([...Reflect.ownKeys(target), ...GO_METHODS]);
    return [...keys];
  },
  getOwnPropertyDescriptor(target, prop) {
    return (
      Object.getOwnPropertyDescriptor(target, prop) ?? {
        configurable: true,
        enumerable: true,
      }
    );
  },
}) as MediaGoApi;

/**
 * Initialize Go direct adapter.
 * After this, GO_METHODS calls go directly to Go Core API,
 * and GO_EVENTS are received via SSE.
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
}

/**
 * Update the API key on the Go adapter (e.g., after signin).
 */
export function setGoApiKey(key: string) {
  if (goHandle) {
    goHandle.setApiKey(key);
  }
}

/**
 * Combined IPC adapter: Go events via EventBridge, platform events via IPC
 */
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
export { electronAdapter, electronIpcAdapter } from "./electron";
