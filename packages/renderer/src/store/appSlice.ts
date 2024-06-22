import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { AppLanguage, AppTheme } from "../types";
import i18n from "../i18n";

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
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppStore(state, { payload }: PayloadAction<Partial<AppStore>>) {
      Object.keys(payload).forEach((key) => {
        if (payload[key] != null) {
          state[key] = payload[key] as never;
          if (key === "language") {
            i18n.changeLanguage(payload[key] as string);
          }
        }
      });
    },
  },
});

export const { setAppStore } = appSlice.actions;
export const selectAppStore = (state: RootState) => state.app;
export default appSlice.reducer;
