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
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (url: string) => Promise<void>;
  getFavorites: () => Promise<Favorite[]>;
  setWebviewBounds: (bounds: any) => void;
  webviewLoadURL: (url?: string) => Promise<void>;
  webviewGoBack: () => Promise<boolean>;
  webviewReload: () => Promise<void>;
  webwiewGoHome: () => Promise<void>;
}

declare interface Favorite {
  title: string;
  url: string;
  icon?: string;
}

declare interface LinkMessage {
  url: string;
  title: string;
}
