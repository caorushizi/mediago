import "reflect-metadata";
import { app, protocol } from "electron";
import { defaultScheme } from "./helper";
import { container } from "./inversify.config";
import { TYPES } from "./types";
import ElectronApp from "app";

const gotTheLock = app.requestSingleInstanceLock();
const start = async (): Promise<void> => {
  if (!gotTheLock) {
    app.quit();
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

  app.on("window-all-closed", () => {
    // empty
  });
};

void start();
