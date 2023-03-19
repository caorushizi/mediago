import Store from "electron-store";
import { inject, injectable } from "inversify";
import { download, workspace } from "../helper/variables";
import { StoreService } from "../interfaces";
import { AppStore, TYPES } from "../types";
import LoggerServiceImpl from "./LoggerServiceImpl";
import SessionServiceImpl from "./SessionServiceImpl";

@injectable()
export default class StoreServiceImpl
  extends Store<AppStore>
  implements StoreService
{
  constructor(
    @inject(TYPES.SessionService)
    private readonly session: SessionServiceImpl,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerServiceImpl
  ) {
    super({
      name: "config",
      cwd: workspace,
      fileExtension: "json",
      watch: true,
      defaults: {
        local: download,
      },
    });
  }

  init(): void {
    this.logger.info("开始初始化 store...");
  }
}
