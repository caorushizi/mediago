import { createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { PageMode } from "../nodes/SourceExtract";

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
    setBrowserStore(state, action) {
      if (action.payload.mode) {
        state.mode = action.payload.mode;
      }
      if (action.payload.url) {
        state.url = action.payload.url;
      }
      if (action.payload.sourceList) {
        state.sourceList = action.payload.sourceList;
      }
      if (action.payload.title) {
        state.title = action.payload.title;
      }
    },
    setUrl(state, action) {
      state.url = action.payload;
    },
    addSource(state, action) {
      if (state.sourceList.find((item) => item.url === action.payload.url)) {
        return;
      }

      state.sourceList = [action.payload, ...state.sourceList];
    },
    restore(state, { payload }: { payload: Partial<BrowserStore> }) {
      Object.keys(payload).forEach((key) => {
        if (payload[key] != null) {
          state[key] = payload[key] as never;
        }
      });
    },
  },
});

export const { setUrl, setBrowserStore, addSource, restore } =
  browserSlice.actions;
export const selectUrl = (state: RootState) => state.browser.url;
export const selectSourceList = (state: RootState) => state.browser.sourceList;
export const selectBrowserStore = (state: RootState) => state.browser;
export default browserSlice.reducer;
