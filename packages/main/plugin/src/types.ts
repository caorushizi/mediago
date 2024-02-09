import { WelcomeBanner } from "./components";

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
    "welcome-banner": WelcomeBanner;
  }
}
