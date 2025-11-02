import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  IS_SETUP,
  IS_SETUP_RESPONSE,
  SETUP_AUTH,
  type SetupAuthRequest,
  SIGNIN,
} from "@mediago/shared-common";
import { handle, i18n, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import StoreService from "../vendor/Store";

@injectable()
@provide(TYPES.Controller)
export default class AuthController implements Controller {
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  @handle(SETUP_AUTH)
  async setupAuth({ apiKey }: SetupAuthRequest) {
    this.store.set("apiKey", apiKey);

    return true;
  }

  @handle(SIGNIN)
  async signin({ apiKey }: SetupAuthRequest) {
    if (apiKey === this.store.get("apiKey")) {
      return true;
    } else {
      throw new Error(i18n.t("signinFailed"));
    }
  }

  @handle(IS_SETUP)
  async isSetup(_: Record<string, never>): Promise<IS_SETUP_RESPONSE> {
    const apiKey = this.store.get("apiKey");
    return { setuped: !!apiKey };
  }
}
