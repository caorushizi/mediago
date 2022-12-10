import { app, BrowserWindow } from "electron";
import handleIpc from "./helper/handleIpc";
import { Sessions } from "./utils/variables";
import handleStore from "./helper/handleStore";
import handleExtension from "./helper/handleExtension";
import handleWindows from "./helper/handleWindows";
import { createSession } from "./core/session";
import handleProtocol from "./helper/handleProtocol";
import handleUpdater from "./helper/handleUpdater";
import "./db";

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
