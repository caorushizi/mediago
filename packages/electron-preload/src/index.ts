import {
  ADD_CONVERSION,
  ADD_DOWNLOAD_ITEMS,
  ADD_FAVORITE,
  CHECK_UPDATE,
  CLEAR_WEBVIEW_CACHE,
  COMBINE_TO_HOME_PAGE,
  CONVERT_TO_AUDIO,
  type ConversionPagination,
  type ConversionResponse,
  DELETE_CONVERSION,
  DELETE_DOWNLOAD_ITEM,
  type DownloadTask,
  type DownloadTaskPagination,
  type DownloadTaskResponse,
  EDIT_DOWNLOAD_ITEM,
  type ElectronApi,
  EXPORT_DOWNLOAD_LIST,
  EXPORT_FAVORITES,
  GET_APP_STORE,
  GET_CONVERSIONS,
  GET_DOWNLOAD_ITEMS,
  GET_DOWNLOAD_LOG,
  GET_ENV_PATH,
  GET_FAVORITES,
  GET_LOCAL_IP,
  GET_MACHINE_ID,
  GET_PAGE_TITLE,
  GET_SHARED_STATE,
  GET_VIDEO_FOLDERS,
  IMPORT_FAVORITES,
  INSTALL_UPDATE,
  ON_DOWNLOAD_LIST_CONTEXT_MENU,
  ON_FAVORITE_ITEM_CONTEXT_MENU,
  OPEN_DIR,
  OPEN_URL,
  PLUGIN_READY,
  REMOVE_FAVORITE,
  SELECT_DOWNLOAD_DIR,
  SELECT_FILE,
  SET_APP_STORE,
  SET_SHARED_STATE,
  SET_WEBVIEW_BOUNDS,
  SHOW_BROWSER_WINDOW,
  SHOW_DOWNLOAD_DIALOG,
  START_DOWNLOAD,
  START_UPDATE,
  STOP_DOWNLOAD,
  WEBVIEW_CHANGE_USER_AGENT,
  WEBVIEW_GO_BACK,
  WEBVIEW_GO_HOME,
  WEBVIEW_HIDE,
  WEBVIEW_LOAD_URL,
  WEBVIEW_RELOAD,
  WEBVIEW_SHOW,
  WEBVIEW_URL_CONTEXTMENU,
  Video,
} from "@mediago/shared-common";
import type {
  AppStore,
  BrowserStore,
  Conversion,
  EnvPath,
  Favorite,
} from "@mediago/shared-node";
import { contextBridge, ipcRenderer, shell } from "electron";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";

const electronApi: ElectronApi = {
  getEnvPath(): Promise<EnvPath> {
    return ipcRenderer.invoke(GET_ENV_PATH);
  },
  getFavorites(): Promise<Favorite[]> {
    return ipcRenderer.invoke(GET_FAVORITES);
  },
  addFavorite(
    favorite: Omit<Favorite, "id" | "createdDate" | "updatedDate">,
  ): Promise<Favorite> {
    return ipcRenderer.invoke(ADD_FAVORITE, favorite);
  },
  removeFavorite(id: number): Promise<void> {
    return ipcRenderer.invoke(REMOVE_FAVORITE, id);
  },
  setWebviewBounds(rect: Electron.Rectangle): Promise<void> {
    return ipcRenderer.invoke(SET_WEBVIEW_BOUNDS, rect);
  },
  webviewGoBack(): Promise<boolean> {
    return ipcRenderer.invoke(WEBVIEW_GO_BACK);
  },
  webviewReload(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_RELOAD);
  },
  webviewLoadURL(url?: string): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_LOAD_URL, url);
  },
  webviewGoHome(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_GO_HOME);
  },
  getAppStore(): Promise<AppStore> {
    return ipcRenderer.invoke(GET_APP_STORE);
  },
  onSelectDownloadDir(): Promise<string> {
    return ipcRenderer.invoke(SELECT_DOWNLOAD_DIR);
  },
  setAppStore(
    key: keyof AppStore,
    val: AppStore[keyof AppStore],
  ): Promise<void> {
    return ipcRenderer.invoke(SET_APP_STORE, key, val);
  },
  async openDir(dir?: string): Promise<void> {
    if (!dir) return;
    return ipcRenderer.invoke(OPEN_DIR, dir);
  },
  createDownloadTasks(
    videos: Omit<DownloadTask, "id">[],
    startDownload?: boolean,
  ): Promise<Video[]> {
    return ipcRenderer.invoke(ADD_DOWNLOAD_ITEMS, videos, startDownload);
  },
  getDownloadTasks(p: DownloadTaskPagination): Promise<DownloadTaskResponse> {
    return ipcRenderer.invoke(GET_DOWNLOAD_ITEMS, p);
  },
  startDownload(vid: number): Promise<void> {
    return ipcRenderer.invoke(START_DOWNLOAD, vid);
  },
  openUrl(url: string): Promise<void> {
    return ipcRenderer.invoke(OPEN_URL, url);
  },
  stopDownload(id: number): Promise<void> {
    return ipcRenderer.invoke(STOP_DOWNLOAD, id);
  },
  onDownloadListContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke(ON_DOWNLOAD_LIST_CONTEXT_MENU, id);
  },
  onFavoriteItemContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke(ON_FAVORITE_ITEM_CONTEXT_MENU, id);
  },
  deleteDownloadTask(id: number): Promise<void> {
    return ipcRenderer.invoke(DELETE_DOWNLOAD_ITEM, id);
  },
  convertToAudio(id: number): Promise<void> {
    return ipcRenderer.invoke(CONVERT_TO_AUDIO, id);
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
    return ipcRenderer.invoke(SHOW_BROWSER_WINDOW);
  },
  webviewHide(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_HIDE);
  },
  webviewShow(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_SHOW);
  },
  appContextMenu(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_URL_CONTEXTMENU);
  },
  combineToHomePage(store: BrowserStore): Promise<void> {
    return ipcRenderer.invoke(COMBINE_TO_HOME_PAGE, store);
  },
  updateDownloadTask(
    video: DownloadTask,
    startDownload?: boolean,
  ): Promise<void> {
    return ipcRenderer.invoke(EDIT_DOWNLOAD_ITEM, video, startDownload);
  },
  getLocalIP(): Promise<string> {
    return ipcRenderer.invoke(GET_LOCAL_IP);
  },
  openBrowser(url: string): Promise<void> {
    return shell.openExternal(url);
  },
  selectFile(): Promise<string> {
    return ipcRenderer.invoke(SELECT_FILE);
  },
  getSharedState(): Promise<any> {
    return ipcRenderer.invoke(GET_SHARED_STATE);
  },
  setSharedState(state: any): Promise<void> {
    return ipcRenderer.invoke(SET_SHARED_STATE, state);
  },
  setUserAgent(isMobile: boolean): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_CHANGE_USER_AGENT, isMobile);
  },
  getDownloadLog(id: number): Promise<string> {
    return ipcRenderer.invoke(GET_DOWNLOAD_LOG, id);
  },
  showDownloadDialog(data: Omit<DownloadTask, "id">[]) {
    return ipcRenderer.invoke(SHOW_DOWNLOAD_DIALOG, data);
  },
  pluginReady() {
    return ipcRenderer.invoke(PLUGIN_READY);
  },
  getConversions(
    pagination: ConversionPagination,
  ): Promise<ConversionResponse> {
    return ipcRenderer.invoke(GET_CONVERSIONS, pagination);
  },
  addConversion(conversion: Omit<Conversion, "id">): Promise<Conversion> {
    return ipcRenderer.invoke(ADD_CONVERSION, conversion);
  },
  deleteConversion(id: number): Promise<void> {
    return ipcRenderer.invoke(DELETE_CONVERSION, id);
  },
  getMachineId(): Promise<string> {
    return ipcRenderer.invoke(GET_MACHINE_ID);
  },
  clearWebviewCache(): Promise<void> {
    return ipcRenderer.invoke(CLEAR_WEBVIEW_CACHE);
  },
  exportFavorites(): Promise<void> {
    return ipcRenderer.invoke(EXPORT_FAVORITES);
  },
  importFavorites(): Promise<void> {
    return ipcRenderer.invoke(IMPORT_FAVORITES);
  },
  checkUpdate(): Promise<void> {
    return ipcRenderer.invoke(CHECK_UPDATE);
  },
  startUpdate(): Promise<void> {
    return ipcRenderer.invoke(START_UPDATE);
  },
  installUpdate(): Promise<void> {
    return ipcRenderer.invoke(INSTALL_UPDATE);
  },
  exportDownloadList(): Promise<void> {
    return ipcRenderer.invoke(EXPORT_DOWNLOAD_LIST);
  },
  getVideoFolders(): Promise<string[]> {
    return ipcRenderer.invoke(GET_VIDEO_FOLDERS);
  },
  getPageTitle(url: string): Promise<any> {
    return ipcRenderer.invoke(GET_PAGE_TITLE, url);
  },
};

contextBridge.exposeInMainWorld(apiKey, electronApi);

// Export for external use
export { electronApi };
export type { ElectronApi };
