import { AppLanguage, AppTheme } from "@mediago/shared-common";
import type { AppStore } from "../types/index";

export interface AppStoreSharedOptions {
  fileExtension: string;
  watch: boolean;
}

export const appStoreSharedOptions: AppStoreSharedOptions = {
  fileExtension: "json",
  watch: true,
};

export const appStoreDefaults: AppStore = {
  local: "",
  promptTone: true,
  proxy: "",
  useProxy: false,
  deleteSegments: true,
  openInNewWindow: false,
  blockAds: true,
  theme: AppTheme.System,
  useExtension: false,
  isMobile: false,
  maxRunner: 2,
  language: AppLanguage.System,
  showTerminal: false,
  privacy: false,
  machineId: "",
  downloadProxySwitch: false,
  autoUpgrade: true,
  allowBeta: false,
  closeMainWindow: false,
  audioMuted: true,
  enableDocker: false,
  dockerUrl: "",
};
