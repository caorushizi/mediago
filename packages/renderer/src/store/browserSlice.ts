import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { PageMode } from "../nodes/SourceExtract";
import useElectron from "../hooks/electron";

const { setSharedState } = useElectron();

const initialState: BrowserStore = {
  mode: PageMode.Default,
  url: "",
  sourceList: [],
  title: "",
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
      setSharedState({
        mode: state.mode,
        url: state.url,
        sourceList: [...state.sourceList],
        title: state.title,
      });
    },
    addSource(state, { payload }: PayloadAction<LinkMessage>) {
      if (state.sourceList.find((item) => item.url === payload.url)) {
        return;
      }
      state.sourceList = [payload, ...state.sourceList];
      // FIXME: 异步函数
      setSharedState({
        mode: state.mode,
        url: state.url,
        sourceList: [...state.sourceList],
        title: state.title,
      });
    },
  },
});

export const { setBrowserStore, addSource } = browserSlice.actions;
export const selectUrl = (state: RootState) => state.browser.url;
export const selectSourceList = (state: RootState) => state.browser.sourceList;
export const selectBrowserStore = (state: RootState) => state.browser;
export default browserSlice.reducer;
