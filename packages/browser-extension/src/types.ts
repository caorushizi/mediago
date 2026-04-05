import type { PlatformApi } from "@mediago/shared-common";
import type { BilibiliButton } from "./components";

declare global {
  interface HTMLElementTagNameMap {
    "bilibili-button": BilibiliButton;
  }
  interface Window {
    electron: PlatformApi;
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
