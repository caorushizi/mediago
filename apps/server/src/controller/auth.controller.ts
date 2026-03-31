import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  IS_SETUP,
  IS_SETUP_RESPONSE,
  SETUP_AUTH,
  type SetupAuthRequest,
  SIGNIN,
} from "@mediago/shared-common";
import { DownloaderServer, handle, i18n, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";

@injectable()
@provide(TYPES.Controller)
export default class AuthController implements Controller {
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  @handle(SETUP_AUTH)
  async setupAuth({ apiKey }: SetupAuthRequest) {
    const client = this.downloaderServer.getClient();
    await client.setConfigKey("apiKey", apiKey);
    return true;
  }

  @handle(SIGNIN)
  async signin({ apiKey }: SetupAuthRequest) {
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    if (apiKey === config.apiKey) {
      return true;
    } else {
      throw new Error(i18n.t("signinFailed"));
    }
  }

  @handle(IS_SETUP)
  async isSetup(_: Record<string, never>): Promise<IS_SETUP_RESPONSE> {
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    return { setuped: !!config.apiKey };
  }
}
