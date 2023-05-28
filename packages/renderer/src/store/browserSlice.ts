import { createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";

const initialState: BrowserStore = {
  addressBarVal: "",
  sourceList: [],
};

export const browserSlice = createSlice({
  name: "browser",
  initialState,
  reducers: {
    setAddressBarVal(state, action) {
      state.addressBarVal = action.payload;
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

export const { setAddressBarVal, addSource, restore } = browserSlice.actions;
export const selectAddressBarVal = (state: RootState) =>
  state.browser.addressBarVal;
export const selectSourceList = (state: RootState) => state.browser.sourceList;
export const selectBrowserStore = (state: RootState) => state.browser;
export default browserSlice.reducer;
