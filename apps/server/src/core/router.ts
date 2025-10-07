import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import Router from "@koa/router";
import { type Controller } from "@mediago/shared-common";
import { TYPES, registerControllerHandlers } from "@mediago/shared-node";
import { inject, injectable, multiInject } from "inversify";
import { error, success } from "../helper/index";
import { API_PREFIX } from "../helper/variables";
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
    registerControllerHandlers(this.controllers, ({ controller, handler, event, method }) => {
      if (method !== "handle") return;

      const finalPath = path.join(API_PREFIX, event).replace(/\\/g, "/").replace(/\/$/, "");

      this.post(finalPath, async (context, next) => {
        try {
          let result = handler.call(controller, context.request.body, context, next);
          if (result && typeof (result as PromiseLike<unknown>).then === "function") {
            result = await result;
          }
          context.body = success(result as Record<string, any>);
        } catch (e: unknown) {
          this.logger.error(e);
          if (e instanceof Error) {
            context.body = error(e.message);
          } else {
            context.body = error(String(e));
          }
        }
      });
    });
  }
}
