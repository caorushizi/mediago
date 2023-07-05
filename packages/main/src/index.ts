import "reflect-metadata";
import { app, protocol } from "electron";
import { defaultScheme } from "./helper/variables";
import { type App } from "./interfaces";
import { container } from "./inversify.config";
import { TYPES } from "./types";

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
  const mediago = container.get<App>(TYPES.App);
  mediago.init();

  app.on("window-all-closed", () => {
    // empty
  });
};

void start();
