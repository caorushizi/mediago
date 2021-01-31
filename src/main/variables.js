import { app } from "electron";

const appData = app.getPath("appData");
const appName = "media downloader";

export default { appData, appName };
