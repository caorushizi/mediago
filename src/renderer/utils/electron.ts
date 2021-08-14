export const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

export const {
  is,
}: {
  is: {
    readonly macos: boolean;
    readonly linux: boolean;
    readonly windows: boolean;
    readonly main: boolean;
    readonly renderer: boolean;
    readonly usingAsar: boolean;
    readonly development: boolean;
    readonly macAppStore: boolean;
    readonly windowsStore: boolean;
  };
} = window.require("electron-util");
