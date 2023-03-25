import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./appSlice";
import downloadSlice from "./downloadSlice";

const store = configureStore({
  reducer: {
    app: appSlice,
    download: downloadSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
