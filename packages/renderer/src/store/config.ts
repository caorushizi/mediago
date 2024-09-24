import { DownloadType } from "@/types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";

type State = {
  // 上次下载类型
  lastDownloadTypes: DownloadType;

  // 上次选择的视频类型(只有 m3u8 可以缓存)
  lastVideoType: string;
  lastVideoName: string;
  lastVideoNumber: number;
};

type Actions = {
  setLastDownloadTypes: (type: DownloadType) => void;
  setLastVideo: (data: {
    type?: string;
    name?: string;
    number?: number;
  }) => void;
};

export type ConfigStore = State & Actions;

export const useConfigStore = create<State & Actions>()(
  persist(
    immer((set) => ({
      lastDownloadTypes: DownloadType.m3u8,
      lastVideoType: "",
      lastVideoName: "",
      lastVideoNumber: 1,
      setLastDownloadTypes: (type) => {
        set((state) => {
          state.lastDownloadTypes = type;
        });
      },
      setLastVideo: ({ type, name, number }) => {
        set((state) => {
          if (type) state.lastVideoType = type;
          if (name) state.lastVideoName = name;
          if (number) state.lastVideoNumber = number;
        });
      },
    })),
    {
      name: "config-storage",
      storage: createJSONStorage(() => localforage),
    },
  ),
);
