import {
  type AppStore,
  type DownloadTask,
  type DownloadTaskPagination,
  type MediaGoApi,
  ADD_DOWNLOAD_ITEMS,
  DELETE_DOWNLOAD_ITEM,
  EDIT_DOWNLOAD_ITEM,
  GET_APP_STORE,
  GET_DOWNLOAD_ITEMS,
  GET_ENV_PATH,
  GET_PAGE_TITLE,
  GET_VIDEO_FOLDERS,
  IS_SETUP,
  SET_APP_STORE,
  SETUP_AUTH,
  SetupAuthRequest,
  SIGNIN,
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
export const webAdapter: MediaGoApi = {
  getEnvPath: async () => {
    return api.post(GET_ENV_PATH);
  },
  getFavorites: async () => defaultResp,
  addFavorite: async () => defaultResp,
  removeFavorite: async () => defaultResp,
  setWebviewBounds: async () => defaultResp,
  webviewGoBack: async () => defaultResp,
  webviewReload: async () => defaultResp,
  webviewLoadURL: async () => defaultResp,
  webviewGoHome: async () => defaultResp,
  getAppStore: async () => {
    return api.post(GET_APP_STORE);
  },
  onSelectDownloadDir: async () => {
    return defaultResp;
  },
  setAppStore: async (key: keyof AppStore, val: AppStore[keyof AppStore]) => {
    return api.post(SET_APP_STORE, { key, val });
  },
  openDir: async () => defaultResp,
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
  onDownloadListContextMenu: async () => defaultResp,
  onFavoriteItemContextMenu: async () => defaultResp,
  deleteDownloadTask: async (id: number) => {
    return api.post(DELETE_DOWNLOAD_ITEM, { id });
  },
  convertToAudio: async () => defaultResp,
  rendererEvent: async () => defaultResp,
  removeEventListener: async () => defaultResp,
  showBrowserWindow: async () => defaultResp,
  webviewHide: async () => defaultResp,
  webviewShow: async () => defaultResp,
  appContextMenu: async () => defaultResp,
  combineToHomePage: async () => defaultResp,
  updateDownloadTask: async (video: DownloadTask, startDownload?: boolean) => {
    return api.post(EDIT_DOWNLOAD_ITEM, { video, startDownload });
  },
  getLocalIP: async () => defaultResp,
  openBrowser: async () => defaultResp,
  selectFile: async () => defaultResp,
  getSharedState: async () => defaultResp,
  setSharedState: async () => defaultResp,
  setUserAgent: async () => defaultResp,
  getDownloadLog: async () => defaultResp,
  showDownloadDialog: async () => defaultResp,
  pluginReady: async () => defaultResp,
  getConversions: async () => defaultResp,
  addConversion: async () => defaultResp,
  deleteConversion: async () => defaultResp,
  getMachineId: async () => defaultResp,
  clearWebviewCache: async () => defaultResp,
  exportFavorites: async () => defaultResp,
  importFavorites: async () => defaultResp,
  checkUpdate: async () => defaultResp,
  startUpdate: async () => defaultResp,
  installUpdate: async () => defaultResp,
  exportDownloadList: async () => defaultResp,
  getVideoFolders: async () => api.post(GET_VIDEO_FOLDERS),
  getPageTitle: async (url: string) => api.post(GET_PAGE_TITLE, { url }),
  setupAuth: async (req: SetupAuthRequest) => api.post(SETUP_AUTH, req),
  signin: async (req: SetupAuthRequest) => api.post(SIGNIN, req),
  isSetup: async () => api.post(IS_SETUP),
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
