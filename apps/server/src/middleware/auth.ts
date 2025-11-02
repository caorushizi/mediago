import { provide } from "@inversifyjs/binding-decorators";
import { IS_SETUP, SETUP_AUTH, SIGNIN } from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import StoreService from "../vendor/Store";
import { error } from "../utils";
import { i18n } from "@mediago/shared-node";

@injectable()
@provide()
export default class AuthMiddleware {
  constructor(
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  async handle(ctx: any, next: () => Promise<any>): Promise<void> {
    // whitelist certain paths if needed
    const whitelist = [SETUP_AUTH, SIGNIN, IS_SETUP];
    if (whitelist.some((path) => ctx.path.includes(path))) {
      await next();
      return;
    }

    // check if apiKey is set up
    const apiKey = this.store.get("apiKey");
    if (!apiKey) {
      ctx.body = error(i18n.t("unauthorized"));
      return;
    }

    // check for auth token in headers or cookies
    const auth = ctx.request.body.auth;

    if (!auth) {
      ctx.body = error(i18n.t("unauthorized"));
      return;
    }

    if (auth !== apiKey) {
      ctx.body = error(i18n.t("unauthorized"));
      return;
    }

    await next();
  }
}
