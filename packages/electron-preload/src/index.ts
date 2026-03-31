import {
  CHECK_UPDATE,
  CLEAR_WEBVIEW_CACHE,
  COMBINE_TO_HOME_PAGE,
  CONVERT_TO_AUDIO,
  EXPORT_DOWNLOAD_LIST,
  EXPORT_FAVORITES,
  GET_ENV_PATH,
  GET_MACHINE_ID,
  GET_SHARED_STATE,
  IMPORT_FAVORITES,
  INSTALL_UPDATE,
  ON_DOWNLOAD_LIST_CONTEXT_MENU,
  ON_FAVORITE_ITEM_CONTEXT_MENU,
  OPEN_DIR,
  OPEN_URL,
  PLUGIN_READY,
  SELECT_DOWNLOAD_DIR,
  SELECT_FILE,
  SET_SHARED_STATE,
  SET_WEBVIEW_BOUNDS,
  SHOW_BROWSER_WINDOW,
  SHOW_DOWNLOAD_DIALOG,
  START_UPDATE,
  WEBVIEW_CHANGE_USER_AGENT,
  WEBVIEW_GO_BACK,
  WEBVIEW_GO_HOME,
  WEBVIEW_HIDE,
  WEBVIEW_LOAD_URL,
  WEBVIEW_RELOAD,
  WEBVIEW_SHOW,
  WEBVIEW_URL_CONTEXTMENU,
  type PlatformApi,
  type DownloadTask,
  type BrowserStore,
  type EnvPath,
} from "@mediago/shared-common";
import { contextBridge, ipcRenderer, shell } from "electron";

const apiFunctions: Record<string, any> = {};

const apiKey = "electron";

/**
 * Only platform-specific methods are exposed via IPC.
 * Data/CRUD operations (GoApi) go directly to Go Core HTTP from the renderer.
 *
 * getEnvPath is a special case: it's in GoApi but also needed before Go adapter
 * is initialized (to discover coreUrl), so we keep it in the preload as well.
 */
const electronApi: PlatformApi & { getEnvPath(): Promise<EnvPath> } = {
  getEnvPath(): Promise<EnvPath> {
    return ipcRenderer.invoke(GET_ENV_PATH);
  },
  onSelectDownloadDir(): Promise<string> {
    return ipcRenderer.invoke(SELECT_DOWNLOAD_DIR);
  },
  async openDir(dir?: string): Promise<void> {
    if (!dir) return;
    return ipcRenderer.invoke(OPEN_DIR, dir);
  },
  openUrl(url: string): Promise<void> {
    return ipcRenderer.invoke(OPEN_URL, url);
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
  webviewHide(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_HIDE);
  },
  webviewShow(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_SHOW);
  },
  onDownloadListContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke(ON_DOWNLOAD_LIST_CONTEXT_MENU, id);
  },
  onFavoriteItemContextMenu(id: number): Promise<void> {
    return ipcRenderer.invoke(ON_FAVORITE_ITEM_CONTEXT_MENU, id);
  },
  convertToAudio(id: number): Promise<void> {
    return ipcRenderer.invoke(CONVERT_TO_AUDIO, id);
  },
  showBrowserWindow(): Promise<void> {
    return ipcRenderer.invoke(SHOW_BROWSER_WINDOW);
  },
  appContextMenu(): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_URL_CONTEXTMENU);
  },
  combineToHomePage(store: BrowserStore): Promise<void> {
    return ipcRenderer.invoke(COMBINE_TO_HOME_PAGE, store);
  },
  selectFile(): Promise<string> {
    return ipcRenderer.invoke(SELECT_FILE);
  },
  getSharedState(): Promise<unknown> {
    return ipcRenderer.invoke(GET_SHARED_STATE);
  },
  setSharedState(state: unknown): Promise<void> {
    return ipcRenderer.invoke(SET_SHARED_STATE, state);
  },
  setUserAgent(isMobile: boolean): Promise<void> {
    return ipcRenderer.invoke(WEBVIEW_CHANGE_USER_AGENT, isMobile);
  },
  showDownloadDialog(data: Omit<DownloadTask, "id">[]) {
    return ipcRenderer.invoke(SHOW_DOWNLOAD_DIALOG, data);
  },
  pluginReady() {
    return ipcRenderer.invoke(PLUGIN_READY);
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
  openBrowser(url: string): Promise<void> {
    return shell.openExternal(url);
  },
  async getLocalIP(): Promise<string> {
    return "";
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
};

contextBridge.exposeInMainWorld(apiKey, electronApi);

export { electronApi };
export type { PlatformApi };
