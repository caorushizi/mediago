import "./utils/sentry";
import "reflect-metadata";
import { buildProviderModule } from "@inversifyjs/binding-decorators";
import { app, protocol } from "electron";
import { Container } from "inversify";
import ElectronApp from "./app";
import { defaultScheme, noop } from "./utils";
import isDev from "electron-is-dev";

const container = new Container({
  defaultScope: "Singleton",
});

const gotTheLock = app.requestSingleInstanceLock();

if (!isDev) {
  app.setAsDefaultProtocolClient("mediago");
} else {
  app.removeAsDefaultProtocolClient("mediago");
}

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
  mediago.init();
  app.on("window-all-closed", noop);
  app.on("second-instance", mediago.secondInstance);
};

void start();
