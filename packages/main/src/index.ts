import "reflect-metadata";
import { app, protocol } from "electron";
import { defaultScheme, noop } from "./helper/index.ts";
import { container } from "./inversify.config.ts";
import { TYPES } from "./types.ts";
import ElectronApp from "./app.ts";

const gotTheLock = app.requestSingleInstanceLock();
const start = async (): Promise<void> => {
  if (!gotTheLock) {
    app.quit();
    return;
  }

  protocol.registerSchemesAsPrivileged([
    {
      scheme: defaultScheme,
      privileges: {
        secure: true,
        standard: true,
      },
    },
  ]);
  await app.whenReady();
  const mediago = container.get<ElectronApp>(TYPES.ElectronApp);
  mediago.init();

  app.on("window-all-closed", noop);
  app.on("second-instance", mediago.secondInstance);
};

void start();
