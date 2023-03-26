import "vite/client";

declare global {
  interface Window {
    electron: ElectronAPI;
    TDAPP: {
      onEvent: (
        eventId: string,
        label: "",
        mapKv: Record<string, string>
      ) => void;
    };
  }
}

export {};
