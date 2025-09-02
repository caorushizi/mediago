import { AppLanguage, AppTheme } from "../types";
import i18n from "../i18n";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const initialState: AppStore = {
  local: "",
  promptTone: true,
  proxy: "",
  useProxy: false,
  deleteSegments: true,
  openInNewWindow: false,
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
  audioMuted: true,
};

type Actions = {
  setAppStore: (values: Partial<AppStore>) => void;
};

export const useAppStore = create<AppStore & Actions>()(
  immer((set) => ({
    ...initialState,
    setAppStore: (values) =>
      set((state) => {
        const { language } = values;
        if (language) {
          i18n.changeLanguage(language);
        }

        Object.entries(values).forEach(([key, val]) => {
          (state as any)[key] = val;
        });
      }),
  })),
);

export const appStoreSelector = (state: AppStore & Actions) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setAppStore, ...appStore } = state;
  return appStore;
};

export const setAppStoreSelector = (state: AppStore & Actions) => {
  return { setAppStore: state.setAppStore };
};
