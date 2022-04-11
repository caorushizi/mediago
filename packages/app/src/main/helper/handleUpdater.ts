import { autoUpdater } from "electron-updater";
import logger from "main/core/logger";
import { protocol } from "electron";
import { defaultScheme } from "main/utils/variables";

protocol.registerSchemesAsPrivileged([
  {
    scheme: defaultScheme,
    privileges: {
      secure: true,
      standard: true,
    },
  },
]);

export default function handleUpdater() {
  autoUpdater.logger = logger;
  autoUpdater.checkForUpdatesAndNotify({
    title: "发现新版本",
    body: "已经下载完成，下次打开时安装~",
  });
}
