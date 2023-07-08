import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import useElectron from "../hooks/electron";

const { setSharedState } = useElectron();

export enum PageMode {
  Default = "default",
  Browser = "browser",
}

export enum BrowserStatus {
  Default = "default",
  Loaded = "loaded",
  Loading = "loading",
  Failed = "failed",
}

const initialState: BrowserStore = {
  mode: PageMode.Default,
  url: "",
  title: "",
  status: BrowserStatus.Default,
  errMsg: "",
};

const convertPlainObject = (obj: unknown) => {
  return JSON.parse(JSON.stringify(obj));
};

export const browserSlice = createSlice({
  name: "browser",
  initialState,
  reducers: {
    setBrowserStore(state, action: PayloadAction<Partial<BrowserStore>>) {
      const { payload } = action;
      Object.keys(payload).forEach((key) => {
        if (payload[key] != null) {
          state[key] = payload[key] as never;
        }
      });
      // FIXME: 异步函数
      setSharedState(convertPlainObject(state));
    },
  },
});

export const { setBrowserStore } = browserSlice.actions;
export const selectUrl = (state: RootState) => state.browser.url;
export const selectBrowserStore = (state: RootState) => state.browser;
export default browserSlice.reducer;
