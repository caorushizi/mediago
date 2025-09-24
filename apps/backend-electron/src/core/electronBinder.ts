import { type ControllerHandlerBinder } from "@mediago/shared-node";
import { error, success } from "../helper/ipcResponse";
import type ElectronLogger from "../vendor/ElectronLogger";

export type IpcMainHandlers = {
  handle: (channel: string, listener: (...args: unknown[]) => unknown) => void;
  on: (channel: string, listener: (...args: unknown[]) => unknown) => void;
};

type LoggerLike = Pick<ElectronLogger, "error">;

type Registration = Parameters<ControllerHandlerBinder>[0];

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown>)?.then === "function";
}

export function createElectronControllerBinder(
  ipc: IpcMainHandlers,
  logger: LoggerLike,
): ControllerHandlerBinder {
  return ({ controller, handler, event, method }: Registration) => {
    if (method !== "on" && method !== "handle") return;

    ipc[method](event, async (...args: unknown[]) => {
      try {
        let result = handler.call(controller, ...args);
        if (isPromiseLike(result)) {
          result = await result;
        }
        return success(result as Record<string, any>);
      } catch (e: unknown) {
        logger.error(`process ipc [${event}] failed: `, e);
        if (e instanceof Error) {
          return error(e.message);
        }
        return error(String(e));
      }
    });
  };
}
