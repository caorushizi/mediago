import "vite/client";
import { ElectronApi } from "../../main/types/preload";

declare global {
  interface Window {
    electron: ElectronApi;
    TDAPP?: {
      onEvent: (
        eventId: string,
        label: "",
        mapKv: Record<string, string>,
      ) => void;
    };
    clarity?: any;
  }
}

export {};
