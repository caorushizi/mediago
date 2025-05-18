import Store from "electron-store";
import { injectable } from "inversify";
import { download, workspace } from "../helper/index.ts";
import { AppLanguage, AppTheme } from "@mediago/shared/common";
import { AppStore } from "@mediago/shared/node";

@injectable()
export default class StoreService extends Store<AppStore> {
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
