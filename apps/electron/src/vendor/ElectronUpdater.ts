import { provide } from "@inversifyjs/binding-decorators";
import { i18n } from "@mediago/shared-node";
import isDev from "electron-is-dev";
import { autoUpdater } from "electron-updater";
import { inject, injectable } from "inversify";
import MainWindow from "../windows/main.window";
import ElectronLogger from "./ElectronLogger";
import ElectronStore from "./ElectronStore";

@injectable()
@provide()
export default class UpdateService {
  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
  ) {}

  async init() {
    const { autoUpgrade, allowBeta } = this.store.store;
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
      this.mainWindow.send("checkingForUpdate");
    });
    autoUpdater.on("update-available", () => {
      this.mainWindow.send("updateAvailable");
    });
    autoUpdater.on("update-not-available", () => {
      this.mainWindow.send("updateNotAvailable");
    });
    autoUpdater.on("download-progress", (progress) => {
      this.logger.info(`progress: ${progress.percent}`);
      this.mainWindow.send("updateDownloadProgress", progress);
    });
    autoUpdater.on("update-downloaded", () => {
      this.mainWindow.send("updateDownloaded");
    });
  }

  async checkForUpdates() {
    setTimeout(
      () => {
        autoUpdater.checkForUpdates();
      },
      1 * 1000 * 60,
    );
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
    autoUpdater.checkForUpdates();
  }

  async startDownload() {
    autoUpdater.downloadUpdate();
  }

  async install() {
    autoUpdater.quitAndInstall();
  }
}
