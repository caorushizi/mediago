import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import Router from "@koa/router";
import { MEDIAGO_EVENT, MEDIAGO_METHOD, type Controller } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
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

  private registerIpc(controller: Controller, propertyKey: string | symbol): void {
    const property = controller[propertyKey];
    if (typeof property !== "function") return;

    const httpMethod: "handle" = Reflect.getMetadata(MEDIAGO_METHOD, controller, propertyKey);
    if (!httpMethod || httpMethod !== "handle") return;

    const routerPath = Reflect.getMetadata(MEDIAGO_EVENT, controller, propertyKey);
    if (!routerPath) return;

    const finalPath = path.join(API_PREFIX, routerPath).replace(/\\/g, "/").replace(/\/$/, "");
    this.post(finalPath, async (context, next) => {
      try {
        let res = property.call(controller, context.request.body, context, next);
        if (res.then) {
          res = await res;
        }
        context.body = success(res);
      } catch (e: unknown) {
        this.logger.error(e);
        if (e instanceof Error) {
          context.body = error(e.message);
        } else {
          context.body = error(String(e));
        }
      }
    });
  }

  init(): void {
    for (const controller of this.controllers) {
      const Class = Object.getPrototypeOf(controller);
      Object.getOwnPropertyNames(Class).forEach((propertyKey) => {
        this.registerIpc(controller, propertyKey);
      });
    }
  }
}
