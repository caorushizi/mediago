import { app, BrowserWindow, crashReporter } from "electron";
import handleIpc from "main/helper/handleIpc";
import { Sessions } from "main/utils/variables";
import handleStore from "main/helper/handleStore";
import handleExtension from "main/helper/handleExtension";
import handleWindows from "main/helper/handleWindows";
import * as Sentry from "@sentry/electron/dist/main";
import { author, name } from "../../package.json";
import { createSession } from "main/core/session";
import handleProtocol from "main/helper/handleProtocol";
import handleUpdater from "main/helper/handleUpdater";

Sentry.init({ dsn: process.env.VITE_APP_SENTRY_DSN });

crashReporter.start({
  companyName: author,
  productName: name,
  ignoreSystemCrashHandler: true,
  submitURL: process.env.VITE_APP_SENTRY_DSN,
});

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.whenReady().then(async () => {
  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await handleWindows();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  handleUpdater();
  handleProtocol();
  createSession(Sessions.PERSIST_MEDIAGO);
  handleWindows();
  handleExtension();
  handleStore();
  handleIpc();
});
