import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { Favorite } from "../entity/Favorite.ts";
import { Vendor } from "../core/vendor.ts";
import { Video } from "../entity/Video.ts";
import { Config } from "../entity/Config.ts";

@injectable()
export default class DatabaseService implements Vendor {
  appDataSource: DataSource;

  constructor() {
    this.appDataSource = new DataSource({
      type: "mysql",
      host: "127.0.0.1",
      port: 3306,
      username: "root",
      password: "123456",
      database: "mediago",
      synchronize: true,
      logging: false,
      charset: "utf8mb4",
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
