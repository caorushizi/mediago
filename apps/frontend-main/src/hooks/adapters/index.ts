import type { ElectronApi } from "@mediago/shared/common";
import { isWeb } from "@/utils";
import { electronAdapter, electronIpcAdapter } from "./electron";
import { webAdapter, webIpcAdapter } from "./web";

/**
 * 根据环境自动选择合适的适配器
 * - Web 环境：使用 webAdapter，通过 HTTP API 与后端通信
 * - Electron 环境：使用 electronAdapter，直接调用 window.electron API
 */
export const apiAdapter: ElectronApi = isWeb ? webAdapter : electronAdapter;

/**
 * 根据环境自动选择合适的 IPC 适配器
 * - Web 环境：使用 Socket.io 通信
 * - Electron 环境：使用 Electron IPC 通信
 */
export const ipcAdapter = isWeb ? webIpcAdapter : electronIpcAdapter;

export type { IpcListener } from "./electron";
export { electronAdapter, electronIpcAdapter } from "./electron";
export { webAdapter, webIpcAdapter } from "./web";
