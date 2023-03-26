import { app, autoUpdater, dialog } from "electron";
import { inject, injectable } from "inversify";
import { LoggerService, type UpdateService } from "../interfaces";
import { TYPES } from "../types";
import isDev from "electron-is-dev";

@injectable()
export default class UpdateServiceImpl implements UpdateService {
  constructor(
    @inject(TYPES.LoggerService) private readonly logger: LoggerService
  ) {
    // empty
  }

  init(): void {
    if (isDev) return;

    const server = process.env.APP_UPDATER_UEL;
    const url = `${server}/update/${process.platform}/${app.getVersion()}`;

    autoUpdater.setFeedURL({ url });
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60000);
    autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: "info",
        buttons: ["Restart", "Later"],
        title: "发现新版本",
        message: process.platform === "win32" ? releaseNotes : releaseName,
        detail: "已经下载完成，下次打开时安装~",
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
      });
    });
    autoUpdater.on("error", (message) => {
      console.error("There was a problem updating the application");
      console.error(message);
    });
  }
}
