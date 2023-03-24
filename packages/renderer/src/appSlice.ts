import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface AppStore {
  count: number;
  downloadList: string[];
  local: string;
  promptTone: boolean;
}

const initialState: AppStore = {
  count: 0,
  downloadList: [],
  local: "",
  promptTone: true,
};

export const counterSlice = createSlice({
  name: "app",
  initialState,
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
