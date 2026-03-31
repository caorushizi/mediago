import type { MediaGoApi } from "@mediago/shared-common";
import { isWeb } from "@/utils";
import { useAppStore } from "@/store/app";
import { electronAdapter, electronIpcAdapter } from "./electron";
import { webAdapter, webIpcAdapter } from "./web";
import { createGoAdapter } from "./go-adapter";

let goAdapter: Partial<MediaGoApi> | null = null;

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
]);

const platformAdapter: MediaGoApi = isWeb ? webAdapter : electronAdapter;

/**
 * 组合适配器：Go 直连 + 平台 Adapter
 * Go adapter 初始化前，所有调用走 platform adapter（降级兼容）
 */
export const apiAdapter = new Proxy(platformAdapter, {
  get(target, prop: string) {
    if (goAdapter && GO_METHODS.has(prop) && prop in goAdapter) {
      const goFn = (goAdapter as any)[prop];
      const platformFn = (target as any)[prop];
      if (typeof goFn === "function" && typeof platformFn === "function") {
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
    return (target as any)[prop];
  },
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  getOwnPropertyDescriptor(target, prop) {
    return Object.getOwnPropertyDescriptor(target, prop);
  },
}) as MediaGoApi;

/**
 * 初始化 Go 直连适配器
 * 调用后，GO_METHODS 中的方法将直接调用 Go API
 */
export function initGoAdapter(coreUrl: string) {
  goAdapter = createGoAdapter(coreUrl, () => {
    const s = useAppStore.getState();
    return { local: s.local, deleteSegments: s.deleteSegments };
  });
}

/**
 * IPC 适配器（实时事件）
 */
export const ipcAdapter = isWeb ? webIpcAdapter : electronIpcAdapter;

export type { IpcListener } from "./electron";
export { electronAdapter, electronIpcAdapter } from "./electron";
export { webAdapter, webIpcAdapter } from "./web";
