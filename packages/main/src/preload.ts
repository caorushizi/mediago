import { contextBridge, ipcRenderer, shell } from "electron";
import { AppStore, BrowserStore, EnvPath } from "./main";
import { type Favorite } from "./entity/Favorite";
import {
  VideoResponse,
  type DownloadItem,
  type DownloadItemPagination,
} from "./interfaces";
import { Video } from "./entity/Video";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";

export type ElectronApi = typeof electronApi;

const electronApi = {
  getEnvPath: (): Promise<EnvPath> => ipcRenderer.invoke("get-env-path"),
  getFavorites: (): Promise<Favorite[]> => ipcRenderer.invoke("get-favorites"),
  addFavorite: (
    favorite: Omit<Favorite, "id" | "createdDate" | "updatedDate">,
  ): Promise<Favorite> => ipcRenderer.invoke("add-favorite", favorite),
  removeFavorite: (id: number): Promise<void> =>
    ipcRenderer.invoke("remove-favorite", id),
  setWebviewBounds: (rect: Electron.Rectangle): Promise<void> =>
    ipcRenderer.invoke("set-webview-bounds", rect),
  webviewGoBack: (): Promise<boolean> => ipcRenderer.invoke("webview-go-back"),
  webviewReload: (): Promise<void> => ipcRenderer.invoke("webview-reload"),
  webviewLoadURL: (url?: string): Promise<void> =>
    ipcRenderer.invoke("webview-load-url", url),
  webviewGoHome: (): Promise<void> => ipcRenderer.invoke("webview-go-home"),
  getAppStore: (): Promise<AppStore> => ipcRenderer.invoke("get-app-store"),
  onSelectDownloadDir: (): Promise<string> =>
    ipcRenderer.invoke("select-download-dir"),
  setAppStore: (
    key: keyof AppStore,
    val: AppStore[keyof AppStore],
  ): Promise<void> => ipcRenderer.invoke("set-app-store", key, val),
  openDir: (dir: string): Promise<void> => ipcRenderer.invoke("open-dir", dir),
  addDownloadItem: (video: Omit<DownloadItem, "id">): Promise<Video> =>
    ipcRenderer.invoke("add-download-item", video),
  addDownloadItems: (videos: DownloadItem[]): Promise<Video[]> =>
    ipcRenderer.invoke("add-download-items", videos),
  getDownloadItems: (p: DownloadItemPagination): Promise<VideoResponse> =>
    ipcRenderer.invoke("get-download-items", p),
  startDownload: (vid: number): Promise<void> =>
    ipcRenderer.invoke("start-download", vid),
  openUrl: (url: string): Promise<void> => ipcRenderer.invoke("open-url", url),
  stopDownload: (id: number): Promise<void> =>
    ipcRenderer.invoke("stop-download", id),
  onDownloadListContextMenu: (id: number): Promise<void> =>
    ipcRenderer.invoke("on-download-list-context-menu", id),
  onFavoriteItemContextMenu: (id: number): Promise<void> =>
    ipcRenderer.invoke("on-favorite-item-context-menu", id),
  deleteDownloadItem: (id: number): Promise<void> =>
    ipcRenderer.invoke("delete-download-item", id),
  convertToAudio: (id: number): Promise<void> =>
    ipcRenderer.invoke("convert-to-audio", id),
  rendererEvent: (channel: string, funcId: string, listener: any): void => {
    const key = `${channel}-${funcId}`;
    apiFunctions[key] = listener;
    ipcRenderer.on(channel, listener);
  },
  removeEventListener: (channel: string, funcId: string): void => {
    const key = `${channel}-${funcId}`;
    const fun = apiFunctions[key];
    ipcRenderer.removeListener(channel, fun);
    delete apiFunctions[key];
  },
  showBrowserWindow: (): Promise<void> =>
    ipcRenderer.invoke("show-browser-window"),
  webviewHide: (): Promise<void> => ipcRenderer.invoke("webview-hide"),
  webviewShow: (): Promise<void> => ipcRenderer.invoke("webview-show"),
  downloadNow: (video: DownloadItem): Promise<void> =>
    ipcRenderer.invoke("download-now", video),
  combineToHomePage: (store: BrowserStore): Promise<void> =>
    ipcRenderer.invoke("combine-to-home-page", store),
  editDownloadItem: (video: DownloadItem): Promise<void> =>
    ipcRenderer.invoke("edit-download-item", video),
  openPlayerWindow: (videoId: string): Promise<void> =>
    ipcRenderer.invoke("open-player-window", videoId),
  getLocalIP: (): Promise<string> => ipcRenderer.invoke("get-local-ip"),
  openBrowser: (url: string): Promise<void> => shell.openExternal(url),
  getSharedState: (): Promise<any> => ipcRenderer.invoke("get-shared-state"),
  setSharedState: (state: any): Promise<void> =>
    ipcRenderer.invoke("set-shared-state", state),
  setUserAgent: (isMobile: boolean): Promise<void> =>
    ipcRenderer.invoke("webview-change-user-agent", isMobile),
};

contextBridge.exposeInMainWorld(apiKey, electronApi);
