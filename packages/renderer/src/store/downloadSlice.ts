import { createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";

interface DownloadStore {
  downloadList: string[];
}

const initialState: DownloadStore = {
  downloadList: [],
};

export const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {},
});

export const selectDownloadCount = (state: RootState) =>
  state.download.downloadList.length;
export default downloadSlice.reducer;
