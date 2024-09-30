import { inject, injectable } from "inversify";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import RouterHandlerService from "./core/router.ts";
import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import Logger from "./vendor/Logger.ts";
import http from "http";
import SocketIO from "./vendor/SocketIO.ts";

@injectable()
export default class ElectronApp extends Koa {
  constructor(
    @inject(TYPES.RouterHandlerService)
    private readonly router: RouterHandlerService,
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.SocketIO)
    private readonly socket: SocketIO,
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

    this.use(cors())
      .use(bodyParser())
      .use(this.router.routes())
      .use(this.router.allowedMethods());

    const server = http.createServer(this.callback());

    this.socket.initSocketIO(server);

    server.listen(3000, () => {
      this.logger.info("Server running on port 3000");
    });
  }
}
