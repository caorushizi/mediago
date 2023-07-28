import { db } from "helper";
import { inject, injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { TYPES } from "../types";
import { LoggerService } from "interfaces";
import { Video } from "entity/Video";
import { Favorite } from "entity/Favorite";

@injectable()
export default class DatabaseService {
  appDataSource: DataSource;

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
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

  async init(): Promise<void> {
    this.logger.info("数据库地址是： ", db);
    await this.appDataSource.initialize();
  }

  get manager(): EntityManager {
    return this.appDataSource.manager;
  }
}
