import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface DownloadStore {
  downloadList: string[];
  count: number;
}

const initialState: DownloadStore = {
  downloadList: [],
  count: 0,
};

type Actions = {
  clearCount: () => void;
  increase: () => void;
};

export const useDownloadStore = create<DownloadStore & Actions>()(
  immer((set) => ({
    ...initialState,
    clearCount: () =>
      set((state) => {
        state.count = 0;
      }),
    increase: () =>
      set((state) => {
        state.count += 1;
      }),
  })),
);

export const downloadStoreSelector = (state: DownloadStore & Actions) => {
  return {
    count: state.count,
    clearCount: state.clearCount,
    increase: state.increase,
  };
};
