import "vite/client";
import type { ElectronApi } from "../../main/types/preload";

declare global {
  interface Window {
    electron: ElectronApi;
    TDAPP?: {
      onEvent: (eventId: string, label: "", mapKv: Record<string, string>) => void;
    };
  }
}

declare module "*.svg" {
  const content: React.FC<React.SVGProps<SVGElement>>;
  export default content;
}
