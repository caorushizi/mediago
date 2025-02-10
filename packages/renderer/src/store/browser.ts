import useElectron from "@/hooks/useElectron";
import { DownloadType } from "@/types";
import { convertPlainObject } from "@/utils";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// eslint-disable-next-line react-hooks/rules-of-hooks
const { setSharedState } = useElectron();

export enum PageMode {
  Default = "default",
  Browser = "browser",
}

export enum BrowserStatus {
  Default = "default",
  Loaded = "loaded",
  Loading = "loading",
  Failed = "failed",
}

export interface SourceData {
  id: number;
  url: string;
  documentURL: string;
  name: string;
  type: DownloadType;
  headers?: string;
}

const initialState: BrowserStore = {
  mode: PageMode.Default,
  url: "",
  title: "",
  status: BrowserStatus.Default,
  errMsg: "",
  errCode: 0,
  sources: [],
};

type Actions = {
  setBrowserStore: (values: Partial<BrowserStore>) => void;
  addSource: (source: SourceData) => void;
  deleteSource: (url: string) => void;
  setSources: (sources: SourceData[]) => void;
  clearSources: () => void;
};

export const useBrowserStore = create<BrowserStore & Actions>()(
  immer((set) => ({
    ...initialState,
    setBrowserStore: (values) =>
      set((state) => {
        Object.keys(values).forEach((key) => {
          if (values[key] != null) {
            state[key] = values[key] as never;
          }
        });
        setSharedState(convertPlainObject(state));
      }),
    addSource: (source) =>
      set((state) => {
        state.sources.push(source);
      }),
    deleteSource: (url) =>
      set((state) => {
        state.sources = state.sources.filter((item: any) => item.url !== url);
      }),
    setSources: (sources) =>
      set((state) => {
        state.sources = sources;
      }),
    clearSources: () =>
      set((state) => {
        state.sources = [];
      }),
  })),
);

export const browserStoreSelector = (state: BrowserStore & Actions) => {
  return {
    mode: state.mode,
    url: state.url,
    title: state.title,
    status: state.status,
    errMsg: state.errMsg,
    errCode: state.errCode,
    sources: state.sources,
  };
};

export const setBrowserSelector = (state: BrowserStore & Actions) => {
  return {
    setBrowserStore: state.setBrowserStore,
    addSource: state.addSource,
    deleteSource: state.deleteSource,
    setSources: state.setSources,
    clearSources: state.clearSources,
  };
};
