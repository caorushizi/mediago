import { inject, injectable } from "inversify";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import IpcHandlerService from "./core/ipc.ts";
import Koa from "koa";

@injectable()
export default class ElectronApp {
  private readonly app: Koa;

  constructor(
    @inject(TYPES.IpcHandlerService)
    private readonly ipc: IpcHandlerService,
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {
    this.app = new Koa();
  }

  private async vendorInit() {
    await this.db.init();
  }

  async init(): Promise<void> {
    this.ipc.init();

    // vendor
    await this.vendorInit();
  }
}
