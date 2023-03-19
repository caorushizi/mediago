import { Favorite } from "entity/Favorite";

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
  getFavorites: () => Promise<Favorite>;
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (url: string) => Promise<void>;
  setWebviewBounds: (rect: Electron.Rectangle) => void;
  webviewLoadURL: (url?: string) => void;
  webviewGoBack: () => Promise<boolean>;
  webviewReload: () => Promise<void>;
  webwiewGoHome: () => Promise<void>;
}
