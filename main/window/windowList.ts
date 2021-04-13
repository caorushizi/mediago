import { is } from "electron-util";
import { IWindowListItem } from "types/main";
import { Windows } from "./variables";

const windowList = new Map<Windows, IWindowListItem>();

windowList.set(Windows.MAIN_WINDOW, {
  url: is.development
    ? "http://localhost:7789/main-window.html"
    : "mediago://electron/main-window.html",
  options() {
    return {
      width: 960,
      minWidth: 960,
      height: 700,
      minHeight: 700,
      show: true,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    };
  },
  callback(window) {
    if (is.development) window.webContents.openDevTools();
    window.once("ready-to-show", () => {
      console.log("main window is ready to show!");
      window.show();
    });
  },
});

windowList.set(Windows.BROWSER_WINDOW, {
  url: is.development
    ? "http://localhost:7789/browser-window.html"
    : "mediago://electron/browser-window.html",
  options(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 800,
      height: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    };
  },
  async callback(window) {
    if (is.development) window.webContents.openDevTools();
  },
});

// windowList.set(Windows.SETTING_WINDOW, {
//   url: is.development
//     ? "http://localhost:7789/setting-window.html"
//     : "mediago://electron/settin-window.html",
//   options(): Electron.BrowserWindowConstructorOptions {
//     return {
//       width: 600,
//       height: 400,
//       show: false,
//       frame: false,
//       webPreferences: {
//         nodeIntegration: false,
//         contextIsolation: true,
//         enableRemoteModule: false,
//         preload: resolve(__dirname, "./preload.js"),
//       },
//     };
//   },
//   async callback(window) {
//     if (is.development) window.webContents.openDevTools();
//   },
// });

// windowList.set(Windows.CONFIRM_WINDOW, {
//   url: is.development
//     ? "http://localhost:7789/confirm-window.html"
//     : "mediago://electron/confirm-window.html",
//   options(): Electron.BrowserWindowConstructorOptions {
//     return {
//       width: 300,
//       height: 200,
//       show: false,
//       frame: false,
//       webPreferences: {
//         nodeIntegration: false,
//         contextIsolation: true,
//         enableRemoteModule: false,
//       },
//     };
//   },
//   async callback(window) {
//     // if (is.development) window.webContents.openDevTools();
//   },
// });

export default windowList;
