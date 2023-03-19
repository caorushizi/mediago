import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const counterSlice = createSlice({
  name: "counter",
  initialState: {
    count: 0,
  },
  reducers: {
    increase(state) {
      state.count--;
    },
    decrease(state) {
      state.count++;
    },
  },
});

export const { increase, decrease } = counterSlice.actions;
export const selectCount = (state: RootState) => state.app.count;
export default counterSlice.reducer;
