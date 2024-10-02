import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { Favorite } from "../entity/Favorite.ts";
import { Vendor } from "../core/vendor.ts";
import { Video } from "../entity/Video.ts";
import { Config } from "../entity/Config.ts";
import { DB_PATH } from "../const.ts";

@injectable()
export default class DatabaseService implements Vendor {
  appDataSource: DataSource;

  constructor() {
    this.appDataSource = new DataSource({
      type: "better-sqlite3",
      database: DB_PATH,
      synchronize: true,
      logging: false,
      entities: [Favorite, Video, Config],
      migrations: [],
      subscribers: [],
    });
  }

  async init() {
    await this.appDataSource.initialize();
  }

  get manager(): EntityManager {
    return this.appDataSource.manager;
  }
}
