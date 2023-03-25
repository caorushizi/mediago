import { contextBridge, ipcRenderer } from "electron/renderer";
import { Favorite } from "entity/Favorite";
import { ElectronAPI } from "./main";

const apiKey = "electron";
const api: ElectronAPI = {
  getEnvPath: () => ipcRenderer.invoke("get-env-path"),
  getFavorites: () => ipcRenderer.invoke("get-favorites"),
  addFavorite: (favorite: Favorite) =>
    ipcRenderer.invoke("add-favorite", favorite),
  removeFavorite: (url: string) => ipcRenderer.invoke("remove-favorite", url),
  setWebviewBounds: (rect) => ipcRenderer.invoke("set-webview-bounds", rect),
  webviewGoBack: () => ipcRenderer.invoke("webview-go-back"),
  webviewReload: () => ipcRenderer.invoke("webview-reload"),
  webviewLoadURL: (url?: string) => ipcRenderer.invoke("webview-load-url", url),
  rendererEvent: (channel, listener) => ipcRenderer.on(channel, listener),
  removeEventListener: (channel, listener) =>
    ipcRenderer.removeListener(channel, listener),
  webwiewGoHome: () => ipcRenderer.invoke("webview-go-home"),
  getAppStore: () => ipcRenderer.invoke("get-app-store"),
  onSelectDownloadDir: () => ipcRenderer.invoke("select-download-dir"),
  setAppStore: (key, val) => ipcRenderer.invoke("set-app-store", key, val),
  openDir: (dir) => ipcRenderer.invoke("open-dir", dir),
  addDownloadItem: (video) => ipcRenderer.invoke("add-download-item", video),
  getDownloadItems: (pagiantion) =>
    ipcRenderer.invoke("get-download-items", pagiantion),
  startDownload: (vid: number) => ipcRenderer.invoke("start-download", vid),
};

contextBridge.exposeInMainWorld(apiKey, api);
