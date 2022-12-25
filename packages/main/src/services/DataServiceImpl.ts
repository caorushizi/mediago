import { DataService } from "../interfaces";
import { db } from "../utils/variables";
import { DataSource, DataSourceOptions } from "typeorm";
import { Collection, Video } from "../entity";
import { injectable } from "inversify";

@injectable()
export default class DataServiceImpl extends DataSource implements DataService {
  constructor() {
    const dbConfig: DataSourceOptions = {
      type: "sqlite",
      database: db,
      synchronize: true,
      logging: false,
      entities: [Video, Collection],
      migrations: [],
      subscribers: [],
    };
    super(dbConfig);
  }

  async init(): Promise<void> {
    await this.initialize();
  }
}
