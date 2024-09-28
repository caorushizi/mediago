import { inject, injectable } from "inversify";
import { ConfigParams, TYPES } from "../types";
import ConfigRepository from "../repository/ConfigRepository";

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
