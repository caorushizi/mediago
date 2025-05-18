import { contextBridge, ipcRenderer } from "electron/renderer";
import { shell } from "electron/common";
import {
  ConversionPagination,
  ConversionResponse,
  ElectronApi,
  VideoResponse,
  type DownloadItem,
  type DownloadItemPagination,
} from "@mediago/shared/common";
import {
  Favorite,
  Video,
  Conversion,
  EnvPath,
  AppStore,
  BrowserStore,
} from "@mediago/shared/node";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";

const electronApi: ElectronApi = {
  getEnvPath(): Promise<EnvPath> {
    return ipcRenderer.invoke("get-env-path");
  },
  getFavorites(): Promise<Favorite[]> {
    return ipcRenderer.invoke("get-favorites");
  },
  addFavorite(
    favorite: Omit<Favorite, "id" | "createdDate" | "updatedDate">
  ): Promise<Favorite> {
    return ipcRenderer.invoke("add-favorite", favorite);
  },
  removeFavorite(id: number): Promise<void> {
    return ipcRenderer.invoke("remove-favorite", id);
  },
  setWebviewBounds(rect: Electron.Rectangle): Promise<void> {
    return ipcRenderer.invoke("set-webview-bounds", rect);
  },
  webviewGoBack(): Promise<boolean> {
    return ipcRenderer.invoke("webview-go-back");
  },
  webviewReload(): Promise<void> {
    return ipcRenderer.invoke("webview-reload");
  },
  webviewLoadURL(url?: string): Promise<void> {
    return ipcRenderer.invoke("webview-load-url", url);
  },
  webviewGoHome(): Promise<void> {
    return ipcRenderer.invoke("webview-go-home");
  },
  getAppStore(): Promise<AppStore> {
    return ipcRenderer.invoke("get-app-store");
  },
  onSelectDownloadDir(): Promise<string> {
    return ipcRenderer.invoke("select-download-dir");
  },
  setAppStore(
    key: keyof AppStore,
    val: AppStore[keyof AppStore]
  ): Promise<void> {
    return ipcRenderer.invoke("set-app-store", key, val);
  },
  async openDir(dir?: string): Promise<void> {
    if (!dir) return;
    return ipcRenderer.invoke("open-dir", dir);
  },
  addDownloadItem(video: Omit<DownloadItem, "id">): Promise<Video> {
    return ipcRenderer.invoke("add-download-item", video);
  },
  addDownloadItems(videos: Omit<DownloadItem, "id">[]): Promise<Video[]> {
    return ipcRenderer.invoke("add-download-items", videos);
  },
  getDownloadItems(p: DownloadItemPagination): Promise<VideoResponse> {
    return ipcRenderer.invoke("get-download-items", p);
  },
  startDownload(vid: number): Promise<void> {
    return ipcRenderer.invoke("start-download", vid);
  },
  openUrl(url: string): Promise<void> {
    return ipcRenderer.invoke("open-url", url);
  },
  stopDownload(id: number): Promise<void> {
    return ipcRenderer.invoke("stop-download", id);
  },
  onDownloadListContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke("on-download-list-context-menu", id);
  },
  onFavoriteItemContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke("on-favorite-item-context-menu", id);
  },
  deleteDownloadItem(id: number): Promise<void> {
    return ipcRenderer.invoke("delete-download-item", id);
  },
  convertToAudio(id: number): Promise<void> {
    return ipcRenderer.invoke("convert-to-audio", id);
  },
  rendererEvent(channel: string, funcId: string, listener: any): void {
    const key = `${channel}-${funcId}`;
    apiFunctions[key] = listener;
    ipcRenderer.on(channel, listener);
  },
  removeEventListener(channel: string, funcId: string): void {
    const key = `${channel}-${funcId}`;
    const fun = apiFunctions[key];
    ipcRenderer.removeListener(channel, fun);
    delete apiFunctions[key];
  },
  showBrowserWindow(): Promise<void> {
    return ipcRenderer.invoke("show-browser-window");
  },
  webviewHide(): Promise<void> {
    return ipcRenderer.invoke("webview-hide");
  },
  webviewShow(): Promise<void> {
    return ipcRenderer.invoke("webview-show");
  },
  webviewUrlContextMenu(): Promise<void> {
    return ipcRenderer.invoke("webview-url-contextmenu");
  },
  downloadNow(video: Omit<DownloadItem, "id">): Promise<void> {
    return ipcRenderer.invoke("download-now", video);
  },
  downloadItemsNow(videos: Omit<DownloadItem, "id">[]): Promise<void> {
    return ipcRenderer.invoke("download-items-now", videos);
  },
  editDownloadNow(video: DownloadItem): Promise<void> {
    return ipcRenderer.invoke("edit-download-now", video);
  },
  combineToHomePage(store: BrowserStore): Promise<void> {
    return ipcRenderer.invoke("combine-to-home-page", store);
  },
  editDownloadItem(video: DownloadItem): Promise<void> {
    return ipcRenderer.invoke("edit-download-item", video);
  },
  getLocalIP(): Promise<string> {
    return ipcRenderer.invoke("get-local-ip");
  },
  openBrowser(url: string): Promise<void> {
    return shell.openExternal(url);
  },
  selectFile(): Promise<string> {
    return ipcRenderer.invoke("select-file");
  },
  getSharedState(): Promise<any> {
    return ipcRenderer.invoke("get-shared-state");
  },
  setSharedState(state: any): Promise<void> {
    return ipcRenderer.invoke("set-shared-state", state);
  },
  setUserAgent(isMobile: boolean): Promise<void> {
    return ipcRenderer.invoke("webview-change-user-agent", isMobile);
  },
  getDownloadLog(id: number): Promise<string> {
    return ipcRenderer.invoke("get-download-log", id);
  },
  showDownloadDialog(data: Omit<DownloadItem, "id">[]) {
    return ipcRenderer.invoke("show-download-dialog", data);
  },
  pluginReady() {
    return ipcRenderer.invoke("plugin-ready");
  },
  getConversions(
    pagination: ConversionPagination
  ): Promise<ConversionResponse> {
    return ipcRenderer.invoke("get-conversions", pagination);
  },
  addConversion(conversion: Omit<Conversion, "id">): Promise<Conversion> {
    return ipcRenderer.invoke("add-conversion", conversion);
  },
  deleteConversion(id: number): Promise<void> {
    return ipcRenderer.invoke("delete-conversion", id);
  },
  getMachineId(): Promise<string> {
    return ipcRenderer.invoke("get-machine-id");
  },
  clearWebviewCache(): Promise<void> {
    return ipcRenderer.invoke("clear-webview-cache");
  },
  openPlayerWindow(): Promise<void> {
    return ipcRenderer.invoke("open-player-window");
  },
  exportFavorites(): Promise<void> {
    return ipcRenderer.invoke("export-favorites");
  },
  importFavorites(): Promise<void> {
    return ipcRenderer.invoke("import-favorites");
  },
  checkUpdate(): Promise<void> {
    return ipcRenderer.invoke("check-update");
  },
  startUpdate(): Promise<void> {
    return ipcRenderer.invoke("start-update");
  },
  installUpdate(): Promise<void> {
    return ipcRenderer.invoke("install-update");
  },
  exportDownloadList(): Promise<void> {
    return ipcRenderer.invoke("export-download-list");
  },
  getVideoFolders(): Promise<string[]> {
    return ipcRenderer.invoke("get-video-folders");
  },
  // ipc with main process to get url params
  //   onUrlParams(callback: (url: string) => void): void {
  //     ipcRenderer.on("url-params", (event, url) => {
  //       callback(url);
  //     });
  //   },
  getPageTitle(url: string): Promise<any> {
    return ipcRenderer.invoke("get-page-title", url);
  },
};

contextBridge.exposeInMainWorld(apiKey, electronApi);
