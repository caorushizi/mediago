import "vite/client";

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
