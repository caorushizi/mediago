import { provide } from "@inversifyjs/binding-decorators";
import { IS_SETUP, SETUP_AUTH, SIGNIN } from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import StoreService from "../vendor/Store";
import { API_PREFIX, error } from "../utils";
import { i18n } from "@mediago/shared-node";
import Logger from "../vendor/Logger";

@injectable()
@provide()
export default class AuthMiddleware {
  constructor(
    @inject(StoreService)
    private readonly store: StoreService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  async handle(ctx: any, next: () => Promise<any>): Promise<void> {
    // skip non-api paths
    if (!ctx.path.startsWith(API_PREFIX)) {
      await next();
      return;
    }

    // whitelist certain paths if needed
    const whitelist = [SETUP_AUTH, SIGNIN, IS_SETUP];
    if (whitelist.some((path) => ctx.path.includes(path))) {
      await next();
      return;
    }

    // check if apiKey is set up
    const apiKey = this.store.get("apiKey");
    if (!apiKey) {
      ctx.body = error(i18n.t("unauthorized"), 401);
      return;
    }

    // check for auth token in headers or cookies
    const auth = ctx.request.body.auth;

    if (!auth) {
      ctx.body = error(i18n.t("unauthorized"), 401);
      return;
    }

    if (auth !== apiKey) {
      ctx.body = error(i18n.t("unauthorized"), 401);
      return;
    }

    await next();
  }
}
