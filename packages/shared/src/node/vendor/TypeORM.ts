import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { Video, Favorite, Conversion } from "../dao/entity/index.ts";

@injectable()
export default class DatabaseService {
  private appDataSource?: DataSource;

  async init({ dbPath }: { dbPath: string }) {
    // TODO: need to add logger
    this.appDataSource = new DataSource({
      type: "better-sqlite3",
      database: dbPath,
      synchronize: true,
      logging: false,
      entities: [Video, Favorite, Conversion],
      migrations: [],
      subscribers: [],
    });
    await this.appDataSource.initialize();
  }

  get manager(): EntityManager {
    if (!this.appDataSource) {
      throw new Error("appDataSource is not initialized");
    }
    return this.appDataSource.manager;
  }
}
