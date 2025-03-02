import Store from "electron-store";
import { injectable } from "inversify";
import { AppStore } from "../main.ts";
import { download, workspace } from "../helper/index.ts";
import { AppLanguage, AppTheme } from "../types.ts";
import { Vendor } from "../core/vendor.ts";

@injectable()
export default class StoreService extends Store<AppStore> implements Vendor {
  constructor() {
    super({
      name: "config",
      cwd: workspace,
      fileExtension: "json",
      watch: true,
      defaults: {
        local: download,
        promptTone: true,
        proxy: "",
        useProxy: false,
        deleteSegments: true,
        openInNewWindow: false,
        blockAds: true,
        theme: AppTheme.System,
        useExtension: false,
        isMobile: false,
        maxRunner: 2,
        language: AppLanguage.System,
        showTerminal: false,
        privacy: false,
        machineId: "",
        downloadProxySwitch: false,
        autoUpgrade: true,
        allowBeta: false,
        closeMainWindow: false,
        audioMuted: true,
        enableDocker: false,
        dockerUrl: "",
      },
    });
  }

  async init() {}
}
