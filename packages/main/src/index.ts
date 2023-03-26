import "reflect-metadata";
import { app, protocol } from "electron";
import { defaultScheme } from "./helper/variables";
import { type App } from "./interfaces";
import { container } from "./inversify.config";
import { TYPES } from "./types";

const start = async (): Promise<void> => {
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
};

void start();
