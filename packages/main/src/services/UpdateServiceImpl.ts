import { LoggerService, UpdateService } from "../interfaces";
import { autoUpdater } from "electron-updater";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

@injectable()
export default class UpdateServiceImpl implements UpdateService {
  constructor(
    @inject(TYPES.LoggerService) private readonly logger: LoggerService
  ) {}
  init(): void {
    autoUpdater.logger = this.logger.logger;
    void autoUpdater.checkForUpdatesAndNotify({
      title: "发现新版本",
      body: "已经下载完成，下次打开时安装~",
    });
  }
}
