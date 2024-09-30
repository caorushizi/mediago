import { inject, injectable } from "inversify";
import { ConfigParams, TYPES } from "../types.ts";
import ConfigRepository from "../repository/ConfigRepository.ts";

@injectable()
export default class ConfigService {
  constructor(
    @inject(TYPES.ConfigRepository)
    private readonly configRepository: ConfigRepository,
  ) {}

  async getConfig() {
    return await this.configRepository.getConfig();
  }

  async setConfig({ key, val }: ConfigParams) {
    return await this.configRepository.setConfig({ key, val });
  }
}
