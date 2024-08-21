import { injectable, multiInject } from "inversify";
import { Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import Router from "@koa/router";
import { success } from "../helper/utils.ts";
import { error } from "console";
// import { error, success } from "../helper/utils.ts";

@injectable()
export default class RouterHandlerService extends Router {
  constructor(
    @multiInject(TYPES.Controller)
    private readonly controllers: Controller[],
  ) {
    super();
  }

  private registerIpc(
    controller: Controller,
    propertyKey: string | symbol,
  ): void {
    const property = controller[propertyKey];
    if (typeof property !== "function") return;

    const httpMethod: "get" | "post" = Reflect.getMetadata(
      "http-method",
      controller,
      propertyKey,
    );
    if (!httpMethod) return;

    const routerPath = Reflect.getMetadata(
      "router-path",
      controller,
      propertyKey,
    );
    if (!routerPath) return;

    this[httpMethod](routerPath, async (context, next) => {
      try {
        let res = property.call(controller, context, next);
        if (res.then) {
          res = await res;
        }
        context.body = success(res);
      } catch (e: unknown) {
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
      Object.getOwnPropertyNames(Class).forEach((propertyKey) =>
        this.registerIpc(controller, propertyKey),
      );
    }
  }
}
