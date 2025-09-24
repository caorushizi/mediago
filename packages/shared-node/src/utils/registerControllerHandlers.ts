import { MEDIAGO_EVENT, MEDIAGO_METHOD, type Controller } from "@mediago/shared-common";

export interface ControllerHandlerRegistration {
  controller: Controller;
  propertyKey: string | symbol;
  handler: (...args: unknown[]) => unknown;
  event: string;
  method: string;
}

export type ControllerHandlerBinder = (registration: ControllerHandlerRegistration) => void;

export function registerControllerHandlers(
  controllers: Controller[],
  binder: ControllerHandlerBinder,
): void {
  for (const controller of controllers) {
    if (!controller) continue;
    const prototype = Object.getPrototypeOf(controller);
    if (!prototype) continue;

    for (const propertyKey of Reflect.ownKeys(prototype)) {
      if (propertyKey === "constructor") continue;
      const handler = Reflect.get(controller as object, propertyKey);
      if (typeof handler !== "function") continue;

      const event = Reflect.getMetadata(MEDIAGO_EVENT, controller, propertyKey);
      const method = Reflect.getMetadata(MEDIAGO_METHOD, controller, propertyKey);

      if (typeof event !== "string" || typeof method !== "string") continue;

      binder({
        controller,
        propertyKey,
        handler: handler as (...args: unknown[]) => unknown,
        event,
        method,
      });
    }
  }
}
