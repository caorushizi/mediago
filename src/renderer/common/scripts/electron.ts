export const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");
