import type { PlatformApi } from "@mediago/shared-common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop = async (..._args: unknown[]): Promise<any> => {};

/**
 * Web/server mode stubs for PlatformApi.
 * All Electron-native operations are no-ops in web mode.
 */
export const webPlatformStubs: PlatformApi = {
  browser: {
    loadURL: noop,
    back: async () => false,
    reload: noop,
    show: noop,
    hide: noop,
    home: noop,
    setBounds: noop,
    setUserAgent: noop,
    clearCache: noop,
    pluginReady: noop,
    showDownloadDialog: noop,
    dismissOverlayDialog: noop,
  },
  app: {
    getEnvPath: async () => ({
      binPath: "",
      dbPath: "",
      workspace: "",
      platform: "",
      local: "",
      playerUrl: "",
      coreUrl: "",
    }),
    getSharedState: async () => ({}),
    setSharedState: noop,
    showBrowserWindow: noop,
    combineToHomePage: noop,
  },
  dialog: {
    open: async () => [],
    save: async () => "",
  },
  shell: {
    open: async (target: string) => {
      const a = document.createElement("a");
      a.href = target;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    },
  },
  contextMenu: {
    show: async () => null,
  },
  update: {
    check: noop,
    startDownload: noop,
    install: noop,
  },
  on: () => {},
  off: () => {},
};
