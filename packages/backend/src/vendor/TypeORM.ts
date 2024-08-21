import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { Favorite } from "../entity/Favorite.ts";
import { Vendor } from "../core/vendor.ts";

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
      entities: [Favorite],
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
