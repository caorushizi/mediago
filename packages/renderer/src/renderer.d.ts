declare interface IndexData {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
}

declare interface ElectronAPI {
  index: () => Promise<IndexData>;
  rendererEvent: (channel: string, listener: any) => void;
  removeEventListener: (channel: string, listener: any) => void;
}
