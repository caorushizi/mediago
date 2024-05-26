import { db } from "../helper/index.ts";
import { inject, injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { TYPES } from "../types.ts";
import { Video } from "../entity/Video.ts";
import { Favorite } from "../entity/Favorite.ts";
import ElectronLogger from "./ElectronLogger.ts";
import { Vendor } from "../core/vendor.ts";

@injectable()
export default class DatabaseService implements Vendor {
  appDataSource: DataSource;

  constructor(
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {
    this.appDataSource = new DataSource({
      type: "better-sqlite3",
      database: db,
      synchronize: true,
      logging: false,
      entities: [Video, Favorite],
      migrations: [],
      subscribers: [],
    });
  }

  async init() {
    this.logger.info("数据库地址是： ", db);
    await this.appDataSource.initialize();
  }

  get manager(): EntityManager {
    return this.appDataSource.manager;
  }
}
