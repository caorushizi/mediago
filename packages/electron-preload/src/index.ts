import {
  IPC,
  type PlatformApi,
  type EnvPath,
  type DownloadTask,
  type BrowserStore,
  type DialogOpenOptions,
  type DialogSaveOptions,
  type ContextMenuItem,
} from "@mediago/shared-common";
import { contextBridge, ipcRenderer } from "electron";

const apiKey = "electron";

/**
 * Only platform-specific methods are exposed via IPC.
 * Data/CRUD operations (GoApi) go directly to Go Core HTTP from the renderer.
 *
 * getEnvPath is a special case: it's in GoApi but also needed before Go adapter
 * is initialized (to discover coreUrl), so we keep it in the preload as well.
 */
const electronApi: PlatformApi = {
  browser: {
    loadURL(url: string): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.loadURL, url);
    },
    back(): Promise<boolean> {
      return ipcRenderer.invoke(IPC.browser.back);
    },
    reload(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.reload);
    },
    show(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.show);
    },
    hide(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.hide);
    },
    home(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.home);
    },
    setBounds(rect: Electron.Rectangle): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.setBounds, rect);
    },
    setUserAgent(isMobile: boolean): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.setUserAgent, isMobile);
    },
    clearCache(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.clearCache);
    },
    pluginReady(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.pluginReady);
    },
    showDownloadDialog(data: Omit<DownloadTask, "id">[]): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.showDownloadDialog, data);
    },
    dismissOverlayDialog(): Promise<void> {
      return ipcRenderer.invoke(IPC.browser.dismissOverlayDialog);
    },
  },
  app: {
    getEnvPath(): Promise<EnvPath> {
      return ipcRenderer.invoke(IPC.app.getEnvPath);
    },
    getExtensionDir(): Promise<string> {
      return ipcRenderer.invoke(IPC.app.getExtensionDir);
    },
    getSharedState(): Promise<unknown> {
      return ipcRenderer.invoke(IPC.app.getSharedState);
    },
    setSharedState(state: unknown): Promise<void> {
      return ipcRenderer.invoke(IPC.app.setSharedState, state);
    },
    showBrowserWindow(): Promise<void> {
      return ipcRenderer.invoke(IPC.app.showBrowserWindow);
    },
    combineToHomePage(store: BrowserStore): Promise<void> {
      return ipcRenderer.invoke(IPC.app.combineToHomePage, store);
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
  update: {
    check(): Promise<void> {
      return ipcRenderer.invoke(IPC.update.check);
    },
    startDownload(): Promise<void> {
      return ipcRenderer.invoke(IPC.update.startDownload);
    },
    install(): Promise<void> {
      return ipcRenderer.invoke(IPC.update.install);
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
