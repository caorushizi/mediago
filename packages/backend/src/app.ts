import { inject, injectable } from "inversify";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import RouterHandlerService from "./core/router.ts";
import Koa from "koa";

@injectable()
export default class ElectronApp extends Koa {
  constructor(
    @inject(TYPES.RouterHandlerService)
    private readonly router: RouterHandlerService,
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {
    super();
  }

  private async vendorInit() {
    await this.db.init();
  }

  async init(): Promise<void> {
    this.router.init();

    // vendor
    await this.vendorInit();

    this.use(this.router.routes()).use(this.router.allowedMethods());

    this.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  }
}
