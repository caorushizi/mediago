import "../apps/backend-web/node_modules/reflect-metadata/Reflect.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { MEDIAGO_EVENT, MEDIAGO_METHOD, type Controller } from "../packages/shared-common/src/index.ts";
import { createElectronControllerBinder, type IpcMainHandlers } from "../apps/backend-electron/src/core/electronBinder.ts";
import RouterHandlerService from "../apps/backend-web/src/core/router.ts";
import type Logger from "../apps/backend-web/src/vendor/Logger.ts";
import { API_PREFIX } from "../apps/backend-web/src/helper/variables.ts";
import { registerControllerHandlers } from "../packages/shared-node/src/utils/registerControllerHandlers.ts";

class StubElectronLogger {
  public readonly errors: unknown[][] = [];

  error(...args: unknown[]): void {
    this.errors.push(args);
  }
}

class StubWebLogger {
  public readonly errors: unknown[][] = [];

  error(...args: unknown[]): void {
    this.errors.push(args);
  }
}

test("Electron router registers handlers and responds with IPC results", async () => {
  class ElectronTestController {
    handleSuccess(_event: unknown, payload: { value: number }) {
      return { received: payload.value };
    }

    handleFailure(): void {
      throw new Error("ipc failed");
    }
  }

  Reflect.defineMetadata(
    MEDIAGO_EVENT,
    "test-channel",
    ElectronTestController.prototype,
    "handleSuccess",
  );
  Reflect.defineMetadata(
    MEDIAGO_METHOD,
    "handle",
    ElectronTestController.prototype,
    "handleSuccess",
  );
  Reflect.defineMetadata(
    MEDIAGO_EVENT,
    "error-channel",
    ElectronTestController.prototype,
    "handleFailure",
  );
  Reflect.defineMetadata(
    MEDIAGO_METHOD,
    "handle",
    ElectronTestController.prototype,
    "handleFailure",
  );

  const controller = new ElectronTestController();
  const controllers: Controller[] = [controller];
  const logger = new StubElectronLogger();
  const handlers: Record<string, (...args: unknown[]) => unknown> = {};
  const ipcMainStub: IpcMainHandlers = {
    handle: (channel, listener) => {
      handlers[channel] = listener;
    },
    on: (channel, listener) => {
      handlers[channel] = listener;
    },
  };

  const binder = createElectronControllerBinder(ipcMainStub, logger);
  registerControllerHandlers(controllers, binder);

  assert.equal(typeof handlers["test-channel"], "function");
  const successResult = await handlers["test-channel"]({}, { value: 7 });
  assert.deepEqual(successResult, {
    code: 0,
    message: "success",
    data: { received: 7 },
  });

  const errorResult = await handlers["error-channel"]({}, {});
  assert.deepEqual(errorResult, { code: -1, message: "ipc failed", data: null });
  assert.equal(logger.errors.length, 1);
  assert.match(String(logger.errors[0][0]), /process ipc \[error-channel\] failed/);
});

test("Web router registers routes and sends controller responses", async () => {
  class WebTestController {
    handleSubmit(body: Record<string, number>) {
      return { doubled: body.value * 2 };
    }

    handleCrash(): void {
      throw new Error("web failed");
    }
  }

  Reflect.defineMetadata(MEDIAGO_EVENT, "submit", WebTestController.prototype, "handleSubmit");
  Reflect.defineMetadata(MEDIAGO_METHOD, "handle", WebTestController.prototype, "handleSubmit");
  Reflect.defineMetadata(MEDIAGO_EVENT, "crash/", WebTestController.prototype, "handleCrash");
  Reflect.defineMetadata(MEDIAGO_METHOD, "handle", WebTestController.prototype, "handleCrash");

  const controller = new WebTestController();
  const controllers: Controller[] = [controller];
  const logger = new StubWebLogger();
  const router = new RouterHandlerService(
    controllers,
    logger as unknown as Logger,
  );
  router.init();

  const stack = (router as unknown as { stack: any[] }).stack;
  const successLayer = stack.find((layer) => layer.path === `${API_PREFIX}/submit`);
  assert.ok(successLayer, "expected success route to be registered");
  const successContext: any = { request: { body: { value: 5 } } };
  await successLayer.stack[0](successContext, async () => {});
  assert.deepEqual(successContext.body, {
    code: 0,
    message: "success",
    data: { doubled: 10 },
  });

  const errorLayer = stack.find((layer) => layer.path === `${API_PREFIX}/crash`);
  assert.ok(errorLayer, "expected error route to be registered without trailing slash");
  const errorContext: any = { request: { body: {} } };
  await errorLayer.stack[0](errorContext, async () => {});
  assert.deepEqual(errorContext.body, { code: -1, message: "web failed", data: null });
  assert.equal(logger.errors.length, 1);
});
