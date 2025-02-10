import { DownloadType } from "@/types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";

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
