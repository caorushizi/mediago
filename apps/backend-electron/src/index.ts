import "reflect-metadata";
import { TYPES } from "@mediago/shared/node";
import { app, protocol } from "electron";
import type ElectronApp from "./app";
import { defaultScheme, noop } from "./helper/index";
import { container } from "./inversify.config";

const gotTheLock = app.requestSingleInstanceLock();
app.setAsDefaultProtocolClient("mediago");
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
  // let initialUrl: string = "";
  // if (process.defaultApp) {
  //   // dev
  //   if (process.argv.length >= 2) {
  //     const urlArg = process.argv.find((arg) => arg.startsWith("mediago://"));
  //     if (urlArg) {
  //       initialUrl = urlArg;
  //     }
  //   }
  // } else {
  //   // prod
  //   if (process.argv.length >= 2) {
  //     const urlArg = process.argv[1];
  //     if (urlArg.startsWith("mediago://")) {
  //       initialUrl = urlArg;
  //     }
  //   }
  // }
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (mediago) {
      mediago.handleOpenUrl(url);
    }
  });
  mediago.init();
  app.on("window-all-closed", noop);
  app.on("second-instance", mediago.secondInstance);
};

void start();
