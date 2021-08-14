import * as React from "react";

export interface AppContext {
  exeFile: string;
  workspace: string;
}

export const AppStateContext = React.createContext<AppContext>({
  exeFile: "",
  workspace: "",
});

export enum SourceStatus {
  Ready = "ready",
  Downloading = "downloading",
  Failed = "failed",
  Success = "success",
}

export enum SourceType {
  M3u8 = "m3u8",
  M4s = "m4s",
}
