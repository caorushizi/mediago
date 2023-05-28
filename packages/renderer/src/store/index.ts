import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./appSlice";
import browserSlice from "./browserSlice";
import downloadSlice from "./downloadSlice";

const store = configureStore({
  reducer: {
    app: appSlice,
    download: downloadSlice,
    browser: browserSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
