import { app } from "electron";
import { is } from "electron-util";
import path from "path";

const appData = app.getPath("appData");
const appName = is.development ? "media downloader dev" : "media downloader";
const workspace = path.resolve(appData, appName);
const workspaceTemp = path.resolve(workspace, "temp");

export { appData, appName, workspace, workspaceTemp };
