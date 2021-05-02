import { app, BrowserWindow, protocol } from "electron";
import { is } from "electron-util";
import { resolve } from "path";
import { log } from "main/utils";
import windowManager from "main/window/windowManager";
import { Windows } from "main/window/variables";
import handleIpc from "main/handleIpc";
import createBrowserView from "main/browserView/create";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (!is.development) {
  global.__bin__ = resolve(app.getAppPath(), "../.bin").replace(/\\/g, "\\\\");
}

const init = async () => {
  windowManager.create(Windows.MAIN_WINDOW);
  // windowManager.create(Windows.SETTING_WINDOW);
  await windowManager.create(Windows.BROWSER_WINDOW);
  await createBrowserView();
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await init();
  }
});

protocol.registerSchemesAsPrivileged([
  { scheme: "mediago", privileges: { secure: true, standard: true } },
]);

app.on("ready", async () => {
  protocol.registerFileProtocol("mediago", (request, callback) => {
    const url = request.url.substr(10);
    callback({ path: resolve(__dirname, "../", url) });
  });

  await init();

  if (is.development) {
    try {
      // const reactTool = resolve(__dirname, "../../devtools/react");
      // await session.defaultSession.loadExtension(reactTool);
      // const reduxTool = resolve(__dirname, "../../devtools/redux");
      // await session.defaultSession.loadExtension(reduxTool);
    } catch (e) {
      log.info(e);
    }
  }
});

handleIpc();
