import Store from "electron-store";
import { injectable } from "inversify";
import { AppStore } from "../main";
import { download, workspace } from "../helper";
import { AppLanguage, AppTheme } from "../types";
import { Vendor } from "../core/vendor";

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
      },
    });
  }

  async init() {}
}
