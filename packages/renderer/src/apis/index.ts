import { api } from "@/utils";
import { ElectronApi } from "../../../main/types/preload";

const defaultResp = {
  code: 0,
  msg: "",
  data: {},
} as any;

const apis: ElectronApi = {
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
    return api.post("get-app-store");
  },
  onSelectDownloadDir: async () => {
    return defaultResp;
  },
  setAppStore: async (key: keyof AppStore, val: AppStore[keyof AppStore]) => {
    return api.post("set-app-store", { key, val });
  },
  openDir: async () => {
    return defaultResp;
  },
  addDownloadItem: async (item: Omit<DownloadItem, "id">) => {
    return api.post("add-download-item", item);
  },
  addDownloadItems: async (items: Omit<DownloadItem, "id">[]) => {
    return api.post("add-download-items", items);
  },
  getDownloadItems: async (p: DownloadItemPagination) => {
    return api.post("get-download-items", p);
  },
  startDownload: async (vid: number) => {
    return api.post("start-download", { vid });
  },
  openUrl: async () => {
    return defaultResp;
  },
  stopDownload: async () => {
    return defaultResp;
  },
  onDownloadListContextMenu: async () => {
    return defaultResp;
  },
  onFavoriteItemContextMenu: async () => {
    return defaultResp;
  },
  deleteDownloadItem: async () => {
    return defaultResp;
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
  downloadNow: async () => {
    return defaultResp;
  },
  downloadItemsNow: async () => {
    return defaultResp;
  },
  editDownloadNow: async () => {
    return defaultResp;
  },
  combineToHomePage: async () => {
    return defaultResp;
  },
  editDownloadItem: async () => {
    return defaultResp;
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
  openPlayerWindow: async () => {
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
};

export default apis;
