import "reflect-metadata";
import { buildProviderModule } from "@inversifyjs/binding-decorators";
import { app, protocol } from "electron";
import { Container } from "inversify";
import ElectronApp from "./app";
import { defaultScheme, noop } from "./utils";

const container = new Container({
  defaultScope: "Singleton",
});

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
  await container.load(buildProviderModule());
  const mediago = container.get(ElectronApp);
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
