import {
  type AppStore,
  type DownloadTask,
  type DownloadTaskPagination,
  type ElectronApi,
  ADD_DOWNLOAD_ITEMS,
  DELETE_DOWNLOAD_ITEM,
  EDIT_DOWNLOAD_ITEM,
  GET_APP_STORE,
  GET_DOWNLOAD_ITEMS,
  GET_PAGE_TITLE,
  GET_VIDEO_FOLDERS,
  SET_APP_STORE,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { api, getSocket } from "@/utils";
import { IpcListener } from "./utils";

const defaultResp = {
  code: 0,
  msg: "",
  data: {},
} as any;

/**
 * Web 环境适配器
 * 为不支持的 Electron 特定功能提供默认实现
 * 对于支持的功能调用后端 HTTP API
 */
export const webAdapter: ElectronApi = {
  getEnvPath: async () => {
    return defaultResp;
  },
  getFavorites: async () => {
    return defaultResp;
  },
  addFavorite: async () => {
    return defaultResp;
  },
  removeFavorite: async () => {
    return defaultResp;
  },
  setWebviewBounds: async () => {
    return defaultResp;
  },
  webviewGoBack: async () => {
    return defaultResp;
  },
  webviewReload: async () => {
    return defaultResp;
  },
  webviewLoadURL: async () => {
    return defaultResp;
  },
  webviewGoHome: async () => {
    return defaultResp;
  },
  getAppStore: async () => {
    return api.post(GET_APP_STORE);
  },
  onSelectDownloadDir: async () => {
    return defaultResp;
  },
  setAppStore: async (key: keyof AppStore, val: AppStore[keyof AppStore]) => {
    return api.post(SET_APP_STORE, { key, val });
  },
  openDir: async () => {
    return defaultResp;
  },
  createDownloadTasks: async (
    items: Omit<DownloadTask, "id">[],
    startDownload?: boolean,
  ) => {
    return api.post(ADD_DOWNLOAD_ITEMS, { videos: items, startDownload });
  },
  getDownloadTasks: async (p: DownloadTaskPagination) => {
    return api.post(GET_DOWNLOAD_ITEMS, p);
  },
  startDownload: async (vid: number) => {
    return api.post(START_DOWNLOAD, { vid });
  },
  openUrl: async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    return defaultResp;
  },
  stopDownload: async (id: number) => {
    return api.post(STOP_DOWNLOAD, { id });
  },
  onDownloadListContextMenu: async () => {
    return defaultResp;
  },
  onFavoriteItemContextMenu: async () => {
    return defaultResp;
  },
  deleteDownloadTask: async (id: number) => {
    return api.post(DELETE_DOWNLOAD_ITEM, { id });
  },
  convertToAudio: async () => {
    return defaultResp;
  },
  rendererEvent: async () => {
    return defaultResp;
  },
  removeEventListener: async () => {
    return defaultResp;
  },
  showBrowserWindow: async () => {
    return defaultResp;
  },
  webviewHide: async () => {
    return defaultResp;
  },
  webviewShow: async () => {
    return defaultResp;
  },
  webviewUrlContextMenu: async () => {
    return defaultResp;
  },
  combineToHomePage: async () => {
    return defaultResp;
  },
  updateDownloadTask: async (video: DownloadTask, startDownload?: boolean) => {
    return api.post(EDIT_DOWNLOAD_ITEM, { video, startDownload });
  },
  getLocalIP: async () => {
    return defaultResp;
  },
  openBrowser: async () => {
    return defaultResp;
  },
  selectFile: async () => {
    return defaultResp;
  },
  getSharedState: async () => {
    return defaultResp;
  },
  setSharedState: async () => {
    return defaultResp;
  },
  setUserAgent: async () => {
    return defaultResp;
  },
  getDownloadLog: async () => {
    return defaultResp;
  },
  showDownloadDialog: async () => {
    return defaultResp;
  },
  pluginReady: async () => {
    return defaultResp;
  },
  getConversions: async () => {
    return defaultResp;
  },
  addConversion: async () => {
    return defaultResp;
  },
  deleteConversion: async () => {
    return defaultResp;
  },
  getMachineId: async () => {
    return defaultResp;
  },
  clearWebviewCache: async () => {
    return defaultResp;
  },
  exportFavorites: async () => {
    return defaultResp;
  },
  importFavorites: async () => {
    return defaultResp;
  },
  checkUpdate: async () => {
    return defaultResp;
  },
  startUpdate: async () => {
    return defaultResp;
  },
  installUpdate: async () => {
    return defaultResp;
  },
  exportDownloadList: async () => {
    return defaultResp;
  },
  getVideoFolders: async () => {
    return api.post(GET_VIDEO_FOLDERS);
  },
  getPageTitle: async (url: string) => {
    return api.post(GET_PAGE_TITLE, { url });
  },
};

/**
 * Web 环境 IPC 适配器
 * 使用 Socket.io 进行通信
 */
export const webIpcAdapter: IpcListener = {
  addIpcListener: (event: string, func: any) => {
    const socket = getSocket();
    socket.on(event, (payload) => func(null, payload));
  },
  removeIpcListener: (event: string, func: any) => {
    const socket = getSocket();
    socket.off(event, (payload) => func(null, payload));
  },
};

export type { IpcListener };
