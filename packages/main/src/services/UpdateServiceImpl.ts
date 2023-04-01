import { autoUpdater } from "electron-updater";
import { inject, injectable } from "inversify";
import { LoggerService, type UpdateService } from "../interfaces";
import { TYPES } from "../types";
import isDev from "electron-is-dev";

@injectable()
export default class UpdateServiceImpl implements UpdateService {
  constructor(
    @inject(TYPES.LoggerService) private readonly logger: LoggerService
  ) {}

  init(): void {
    if (isDev) return;

    autoUpdater.disableWebInstaller = true;
    autoUpdater.logger = this.logger.logger;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
