import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface AppStore {
  count: number;
  downloadList: string[];
}

export const counterSlice = createSlice({
  name: "app",
  initialState: {
    count: 0,
    downloadList: [],
    local: "",
    promptTone: true,
  },
  reducers: {
    increase(state) {
      state.count--;
    },
    decrease(state) {
      state.count++;
    },
    setAppStore(state, { payload }) {
      state.local = payload.local;
      state.promptTone = payload.promptTone;
    },
  },
});

export const { increase, decrease } = counterSlice.actions;
export const selectCount = (state: RootState) => state.app.count;
export default counterSlice.reducer;
