import type { PlatformApi } from "@mediago/shared-common";

const noop = async () => {};

/**
 * Web/server mode stubs for PlatformApi.
 * All Electron-native operations are no-ops in web mode.
 */
export const webPlatformStubs: PlatformApi = {
  onSelectDownloadDir: async () => "",
  openDir: noop,
  setWebviewBounds: noop,
  webviewGoBack: async () => false,
  webviewReload: noop,
  webviewLoadURL: noop,
  webviewGoHome: noop,
  webviewHide: noop,
  webviewShow: noop,
  onDownloadListContextMenu: noop,
  onFavoriteItemContextMenu: noop,
  showBrowserWindow: noop,
  appContextMenu: noop,
  combineToHomePage: noop,
  selectFile: async () => "",
  getSharedState: async () => ({}),
  setSharedState: noop,
  setUserAgent: noop,
  showDownloadDialog: async () => null,
  pluginReady: noop,
  getMachineId: async () => "",
  clearWebviewCache: noop,
  exportFavorites: noop,
  importFavorites: noop,
  checkUpdate: noop,
  startUpdate: noop,
  installUpdate: noop,
  exportDownloadList: noop,
  openUrl: async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  },
  openBrowser: async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  },
  getLocalIP: async () => "",
  rendererEvent: () => {},
  removeEventListener: () => {},
};
