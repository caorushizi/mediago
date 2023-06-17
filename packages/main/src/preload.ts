import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "./main";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";
const handleApi: ElectronAPI = {
  getEnvPath: () => ipcRenderer.invoke("get-env-path"),
  getFavorites: () => ipcRenderer.invoke("get-favorites"),
  addFavorite: (favorite) => ipcRenderer.invoke("add-favorite", favorite),
  removeFavorite: (id) => ipcRenderer.invoke("remove-favorite", id),
  setWebviewBounds: (rect) => ipcRenderer.invoke("set-webview-bounds", rect),
  webviewGoBack: () => ipcRenderer.invoke("webview-go-back"),
  webviewReload: () => ipcRenderer.invoke("webview-reload"),
  webviewLoadURL: (url?: string) => ipcRenderer.invoke("webview-load-url", url),
  webwiewGoHome: () => ipcRenderer.invoke("webview-go-home"),
  getAppStore: () => ipcRenderer.invoke("get-app-store"),
  onSelectDownloadDir: () => ipcRenderer.invoke("select-download-dir"),
  setAppStore: (key, val) => ipcRenderer.invoke("set-app-store", key, val),
  openDir: (dir) => ipcRenderer.invoke("open-dir", dir),
  addDownloadItem: (video) => ipcRenderer.invoke("add-download-item", video),
  getDownloadItems: (p) => ipcRenderer.invoke("get-download-items", p),
  startDownload: (vid) => ipcRenderer.invoke("start-download", vid),
  openUrl: (url: string) => ipcRenderer.invoke("open-url", url),
  stopDownload: (id) => ipcRenderer.invoke("stop-download", id),
  onDownloadListContextMenu: (id) =>
    ipcRenderer.invoke("on-download-list-context-menu", id),
  onFavoriteItemContextMenu: (id) =>
    ipcRenderer.invoke("on-favorite-item-context-menu", id),
  deleteDownloadItem: (id) => ipcRenderer.invoke("delete-download-item", id),
  convertToAudio: (id) => ipcRenderer.invoke("convert-to-audio", id),
  rendererEvent: (channel, funcId, listener) => {
    const key = `${channel}-${funcId}`;
    apiFunctions[key] = listener;
    ipcRenderer.on(channel, listener);
  },
  removeEventListener: (channel, funcId) => {
    const key = `${channel}-${funcId}`;
    const fun = apiFunctions[key];
    ipcRenderer.removeListener(channel, fun);
    delete apiFunctions[key];
  },
  showBrowserWindow: (store) =>
    ipcRenderer.invoke("show-browser-window", store),
  webviewHide: () => ipcRenderer.invoke("webview-hide"),
  webviewShow: () => ipcRenderer.invoke("webview-show"),
  downloadNow: (video) => ipcRenderer.invoke("download-now", video),
  combineToHomePage: (store) =>
    ipcRenderer.invoke("combine-to-home-page", store),
  editDownloadItem: (video) => ipcRenderer.invoke("edit-download-item", video),
  openPlayerWindow: (videoId) =>
    ipcRenderer.invoke("open-player-window", videoId),
  getLocalIP: () => ipcRenderer.invoke("get-local-ip"),
};

contextBridge.exposeInMainWorld(apiKey, handleApi);
