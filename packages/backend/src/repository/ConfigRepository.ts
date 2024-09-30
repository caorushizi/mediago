import { inject, injectable } from "inversify";
import { ConfigParams, TYPES } from "../types.ts";
import TypeORM from "../vendor/TypeORM.ts";
import { Repository } from "typeorm";
import { Config } from "../entity/Config.ts";

@injectable()
export default class ConfigRepository {
  repository: Repository<Config>;

  constructor(
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {
    this.repository = this.db.manager.getRepository(Config);
  }

  async getConfig(): Promise<Config> {
    const config = await this.repository.findOneBy({ id: 1 });
    if (!config) {
      return await this.repository.save(new Config());
    }
    return config;
  }

  async setConfig({ key, val }: ConfigParams) {
    const config = await this.getConfig();
    this.repository.update(config.id, { [key]: val });
  }
}
