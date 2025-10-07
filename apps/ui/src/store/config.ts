import localforage from "localforage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { DownloadType } from "@/types";

type State = {
  // Last download type
  lastIsBatch: boolean;
  lastDownloadTypes: DownloadType;
};

type Actions = {
  setLastDownloadTypes: (type: DownloadType) => void;
  setLastIsBatch: (isBatch: boolean) => void;
};

export const useConfigStore = create<State & Actions>()(
  persist(
    immer((set) => ({
      lastIsBatch: false,
      lastDownloadTypes: DownloadType.m3u8,
      setLastDownloadTypes: (type) => {
        set((state) => {
          state.lastDownloadTypes = type;
        });
      },
      setLastIsBatch: (isBatch) => {
        set((state) => {
          state.lastIsBatch = isBatch;
        });
      },
    })),
    {
      name: "config-storage",
      storage: createJSONStorage(() => localforage),
    },
  ),
);

export const downloadFormSelector = (s: State & Actions) => ({
  lastIsBatch: s.lastIsBatch,
  lastDownloadTypes: s.lastDownloadTypes,
  setLastDownloadTypes: s.setLastDownloadTypes,
  setLastIsBatch: s.setLastIsBatch,
});
