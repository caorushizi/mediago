import { BilibiliButton } from "./components";
import { ElectronApi } from "../../main/types/preload";

export enum DownloadType {
  m3u8 = "m3u8",
  bilibili = "bilibili",
}

export interface WebSource {
  url: string;
  type: DownloadType;
  name: string;
  headers?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "bilibili-button": BilibiliButton;
  }
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
