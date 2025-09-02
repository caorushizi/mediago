import { AppLanguage, AppTheme } from "@mediago/shared/common";
import { AppStore } from "@mediago/shared/node";
import { injectable } from "inversify";
import Conf from "conf";
import { DOWNLOAD_DIR, WORKSPACE } from "../helper/variables.ts";

@injectable()
export default class StoreService extends Conf<AppStore> {
  constructor() {
    super({
      projectName: "config",
      cwd: WORKSPACE,
      fileExtension: "json",
      watch: true,
      defaults: {
        local: DOWNLOAD_DIR,
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
