export enum Executor {
  M3u8Down,
  MediaGo,
}

export interface Settings {
  workspace: string;
  warningTone: boolean;
  proxy: string;
  executor: Executor;
}
