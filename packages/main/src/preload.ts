import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "./main";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";
const handleApi: ElectronAPI = {
  getEnvPath: () => ipcRenderer.invoke("get-env-path"),
  getFavorites: () => ipcRenderer.invoke("get-favorites"),
  addFavorite: (favorite) => ipcRenderer.invoke("add-favorite", favorite),
  removeFavorite: (url: string) => ipcRenderer.invoke("remove-favorite", url),
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
  startDownload: (vid: number) => ipcRenderer.invoke("start-download", vid),
  openUrl: (url: string) => ipcRenderer.invoke("open-url", url),
  stopDownload: (id) => ipcRenderer.invoke("stop-download", id),
  onDownloadListContextMenu: (id) =>
    ipcRenderer.invoke("on-download-list-context-menu", id),
  deleteDownloadItem: (id) => ipcRenderer.invoke("delete-download-item", id),
  rendererEvent: (channel, listener) => {
    apiFunctions[channel] = listener;
    ipcRenderer.on(channel, listener);
  },
  removeEventListener: (channel) => {
    const fun = apiFunctions[channel];
    ipcRenderer.removeListener(channel, fun);
    delete apiFunctions[channel];
  },
};

contextBridge.exposeInMainWorld(apiKey, handleApi);
