import { remote } from "electron";
import path from "path";

const appData = remote.app.getPath("appData");
const appName = "media downloader";

window.binaryDir = path.join(appData, appName);
