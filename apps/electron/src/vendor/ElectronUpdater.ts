import { provide } from "@inversifyjs/binding-decorators";
import { i18n } from "../core/i18n";
import isDev from "electron-is-dev";
import { autoUpdater } from "electron-updater";
import { inject, injectable } from "inversify";
import GoConfigCache from "../services/go-config-cache";
import MainWindow from "../windows/main.window";
import ElectronLogger from "./ElectronLogger";

@injectable()
@provide()
export default class UpdateService {
  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(GoConfigCache)
    private readonly configCache: GoConfigCache,
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
  ) {}

  async init() {
    const { autoUpgrade, allowBeta } = this.configCache.store;
    autoUpdater.disableWebInstaller = true;
    autoUpdater.logger = this.logger.logger;
    autoUpdater.allowPrerelease = allowBeta;
    if (isDev) {
      autoUpdater.forceDevUpdateConfig = true;
    }
    if (autoUpgrade) {
      autoUpdater.autoDownload = true;
      this.autoUpdate();
    } else {
      autoUpdater.autoDownload = false;
      this.checkForUpdates();
    }
    autoUpdater.on("checking-for-update", () => {
      this.mainWindow.send("update:checking");
    });
    autoUpdater.on("update-available", () => {
      this.mainWindow.send("update:available");
    });
    autoUpdater.on("update-not-available", () => {
      this.mainWindow.send("update:notAvailable");
    });
    autoUpdater.on("download-progress", (progress) => {
      this.logger.info(`progress: ${progress.percent}`);
      this.mainWindow.send("update:downloadProgress", progress);
    });
    autoUpdater.on("update-downloaded", () => {
      this.mainWindow.send("update:downloaded");
    });
  }

  async checkForUpdates() {
    setTimeout(async () => {
      try {
        await autoUpdater.checkForUpdates();
      } catch (e) {
        this.logger.error("Check for updates failed", e);
      }
    }, 60_000);
  }

  async autoUpdate() {
    try {
      await autoUpdater.checkForUpdatesAndNotify({
        title: i18n.t("autoUpdateSuccess"),
        body: i18n.t("nextTimeWillAutoInstall"),
      });
    } catch (e) {
      this.logger.error("update error", e);
    }
  }

  async changeAllowBeta(allowBeta: boolean) {
    autoUpdater.allowPrerelease = allowBeta;
  }

  async manualUpdate() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      this.logger.error("Manual update check failed", e);
    }
  }

  async startDownload() {
    autoUpdater.downloadUpdate();
  }

  async install() {
    autoUpdater.quitAndInstall();
  }
}
