import { createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";

interface DownloadStore {
  downloadList: string[];
  count: number;
}

const initialState: DownloadStore = {
  downloadList: [],
  count: 0,
};

export const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    clearCount(state) {
      state.count = 0;
    },
    increase(state) {
      state.count++;
    },
  },
});

export const { clearCount, increase } = downloadSlice.actions;
export const selectCount = (state: RootState) => state.download.count;
export default downloadSlice.reducer;
