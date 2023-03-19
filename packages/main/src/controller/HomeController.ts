import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { handle, on } from "../helper/decorator";
import { StoreService, LoggerService, type Controller } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class HomeController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly store: StoreService
  ) {
    // empty
  }

  @handle("index")
  async index(): Promise<IndexData> {
    return {
      binPath: __bin__,
      dbPath: db,
      workspace: workspace,
      platform: process.platform,
    };
  }

  @on("webview-hidden")
  webviewHidden() {
    //  empty
  }
}
