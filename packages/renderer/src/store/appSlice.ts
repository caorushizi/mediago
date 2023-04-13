import { createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";

const initialState: AppStore = {
  local: "",
  promptTone: true,
  proxy: "",
  useProxy: false,
  deleteSegments: true,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppStore(state, { payload }) {
      const { local, promptTone, proxy, useProxy } = payload;
      if (local) {
        state.local = payload.local;
      }
      if (promptTone != null) {
        state.promptTone = payload.promptTone;
      }
      if (proxy != null) {
        state.proxy = proxy;
      }
      if (useProxy != null) {
        state.useProxy = useProxy;
      }
    },
  },
});

export const { setAppStore } = appSlice.actions;
export const selectStore = (state: RootState) => state.app;
export default appSlice.reducer;
