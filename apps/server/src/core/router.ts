import { provide } from "@inversifyjs/binding-decorators";
import Router from "@koa/router";
import { type Controller } from "@mediago/shared-common";
import { TYPES, registerControllerHandlers } from "@mediago/shared-node";
import { inject, injectable, multiInject } from "inversify";
import { error, success } from "../utils";
import { API_PREFIX } from "../constants";
import Logger from "../vendor/Logger";

@injectable()
@provide()
export default class RouterHandlerService extends Router {
  constructor(
    @multiInject(TYPES.Controller)
    private readonly controllers: Controller[],
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    super();
  }

  init(): void {
    this.prefix(API_PREFIX);
    registerControllerHandlers(
      this.controllers,
      ({ controller, handler, event, method }) => {
        if (method !== "handle") return;

        this.post(`/${event}`, async (ctx, next) => {
          try {
            let result = handler.call(controller, ctx.request.body, ctx, next);
            if (
              result &&
              typeof (result as PromiseLike<unknown>).then === "function"
            ) {
              result = await result;
            }
            ctx.body = success(result as Record<string, any>);
          } catch (e: unknown) {
            this.logger.error(e);
            if (e instanceof Error) {
              ctx.body = error(e.message);
            } else {
              ctx.body = error(String(e));
            }
          }
        });
      },
    );
  }
}
