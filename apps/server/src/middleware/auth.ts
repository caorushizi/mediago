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
    let auth = ctx.cookies.get("auth");

    if (!auth && ctx.request.body.auth) {
      auth = ctx.request.body.auth;
    }

    if (!auth) {
      ctx.body = error(i18n.t("unauthorized"));
      return;
    }

    const isValid = this.validate(auth);
    if (!isValid) {
      ctx.body = error(i18n.t("unauthorized"));
      return;
    }

    ctx.cookies.set("auth", auth, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    next();
  }

  validate(auth: string): boolean {
    // Implement your authentication logic here
    return auth === "valid_token"; // Example validation
  }
}
