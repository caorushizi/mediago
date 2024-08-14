import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { Favorite } from "../entity/Favorite.ts";
import { Vendor } from "../core/vendor.ts";

@injectable()
export default class DatabaseService implements Vendor {
  appDataSource: DataSource;

  constructor() {
    this.appDataSource = new DataSource({
      type: "better-sqlite3",
      database: "fake.db",
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
