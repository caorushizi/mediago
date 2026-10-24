import {
  IPC,
  type PlatformApi,
  type EnvPath,
  type DownloadTask,
  type BrowserStore,
  type BrowserTabSnapshot,
  type BrowserTabsSnapshot,
  type CreateBrowserTabInput,
  type DialogOpenOptions,
  type DialogSaveOptions,
  type ContextMenuItem,
  type CLIInstallOptions,
} from "@mediago/common";
import { contextBridge, ipcRenderer, webUtils } from "electron";

const apiKey = "electron";

/**
 * Only platform-specific methods are exposed via IPC.
 * Data/CRUD operations (GoApi) go directly to Go Core HTTP from the renderer.
 *
 * getEnvPath is a special case: it's in GoApi but also needed before Go adapter
 * is initialized (to discover coreUrl), so we keep it in the preload as well.
 */
const electronApi: PlatformApi = {
  analytics: {
    getConsent() {
      return ipcRenderer.invoke(IPC.analytics.getConsent);
    },
    setConsent(enabled: boolean) {
      return ipcRenderer.invoke(IPC.analytics.setConsent, enabled);
    },
  },
  browser: {
    createTab(options?: CreateBrowserTabInput): Promise<BrowserTabSnapshot> {
      return ipcRenderer.invoke(IPC.browser.createTab, options);
    },
    activateTab(tabId: string): Promise<BrowserTabsSnapshot> {
      return ipcRenderer.invoke(IPC.browser.activateTab, tabId);
    },
    closeTab(tabId: string): Promise<BrowserTabsSnapshot> {
      return ipcRenderer.invoke(IPC.browser.closeTab, tabId);
    },
    getTabs(): Promise<BrowserTabsSnapshot> {
      return ipcRenderer.invoke(IPC.browser.getTabs);
    },
    loadURL(tabIdOrUrl: string, url?: string): Promise<void> {
      return ipcRenderer.invoke(
        IPC.browser.loadURL,
        url === undefined
          ? { tabId: "", url: tabIdOrUrl }
          : { tabId: tabIdOrUrl, url },
      );
    },
    back(tabId?: string): Promise<boolean> {
      return ipcRenderer.invoke(IPC.browser.back, tabId);
    },
    reload(tabId?: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.reload, tabId);
    },
    show(tabId?: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.show, tabId);
    },
    hide(tabId?: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.hide, tabId);
    },
    home(tabId?: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.home, tabId);
    },
    setBounds(
      tabIdOrRect: string | Electron.Rectangle,
      rect?: Electron.Rectangle,
    ): Promise<void> {
      return ipcRenderer.invoke(
        IPC.browser.setBounds,
        typeof tabIdOrRect === "string"
          ? { tabId: tabIdOrRect, bounds: rect }
          : { tabId: "", bounds: tabIdOrRect },
      );
    },
    setDeviceMode(
      tabIdOrIsMobile: string | boolean,
      isMobile?: boolean,
    ): Promise<void> {
      return ipcRenderer.invoke(
        IPC.browser.setUserAgent,
        typeof tabIdOrIsMobile === "string"
          ? { tabId: tabIdOrIsMobile, isMobile: isMobile === true }
          : { tabId: "", isMobile: tabIdOrIsMobile },
      );
    },
    clearCache(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.clearCache);
    },
    pluginReady(tabId?: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.pluginReady, tabId);
    },
    showDownloadDialog(
      tabIdOrData: string | Omit<DownloadTask, "id">[],
      data?: Omit<DownloadTask, "id">[],
    ): Promise<void> {
      return ipcRenderer.invoke(
        IPC.browser.showDownloadDialog,
        typeof tabIdOrData === "string"
          ? { tabId: tabIdOrData, data: data ?? [] }
          : { tabId: "", data: tabIdOrData },
      );
    },
    dismissOverlayDialog(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.dismissOverlayDialog);
    },
  },
  app: {
    getEnvPath(): Promise<EnvPath> {
      return ipcRenderer.invoke(IPC.app.getEnvPath);
    },
    async getPathForFile(file: File): Promise<string> {
      return webUtils.getPathForFile(file);
    },
    getExtensionDir(): Promise<string> {
      return ipcRenderer.invoke(IPC.app.getExtensionDir);
    },
    getPreferredSystemLanguage(): Promise<string> {
      return ipcRenderer.invoke(IPC.app.getPreferredSystemLanguage);
    },
    getSharedState(): Promise<BrowserTabsSnapshot> {
      return ipcRenderer.invoke(IPC.app.getSharedState);
    },
    setSharedState(state: unknown): Promise<void> {
      return ipcRenderer.invoke(IPC.app.setSharedState, state);
    },
    showBrowserWindow(): Promise<void> {
      return ipcRenderer.invoke(IPC.app.showBrowserWindow);
    },
    combineToHomePage(
      store?: BrowserTabsSnapshot | BrowserStore,
    ): Promise<void> {
      return ipcRenderer.invoke(IPC.app.combineToHomePage, store);
    },
    drainShareIntents() {
      return ipcRenderer.invoke(IPC.app.drainShareIntents);
    },
  },
  dialog: {
    open(options: DialogOpenOptions): Promise<string[]> {
      return ipcRenderer.invoke(IPC.dialog.open, options);
    },
    save(options: DialogSaveOptions): Promise<string> {
      return ipcRenderer.invoke(IPC.dialog.save, options);
    },
  },
  shell: {
    open(target: string): Promise<void> {
      return ipcRenderer.invoke(IPC.shell.open, target);
    },
  },
  contextMenu: {
    show(items: ContextMenuItem[]): Promise<string | null> {
      return ipcRenderer.invoke(IPC.contextMenu.show, items);
    },
  },
  cli: {
    getStatus() {
      return ipcRenderer.invoke(IPC.cli.getStatus);
    },
    install(options: CLIInstallOptions) {
      return ipcRenderer.invoke(IPC.cli.install, options);
    },
  },
  update: {
    getState() {
      return ipcRenderer.invoke(IPC.update.getState);
    },
    check() {
      return ipcRenderer.invoke(IPC.update.check);
    },
    startDownload() {
      return ipcRenderer.invoke(IPC.update.startDownload);
    },
    install() {
      return ipcRenderer.invoke(IPC.update.install);
    },
    openLogDirectory() {
      return ipcRenderer.invoke(IPC.update.openLogDirectory);
    },
    getDiagnosticInfo() {
      return ipcRenderer.invoke(IPC.update.getDiagnosticInfo);
    },
  },
  on(channel: string, listener: (...args: unknown[]) => void): void {
    ipcRenderer.on(channel, listener);
  },
  off(channel: string, listener: (...args: unknown[]) => void): void {
    ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld(apiKey, electronApi);

export { electronApi };
export type { PlatformApi };
