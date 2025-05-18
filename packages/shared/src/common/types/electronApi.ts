import type {
  Conversion,
  Favorite,
  Video,
} from "../../node/dao/entity/index.ts";
import type {
  AppStore,
  BrowserStore,
  EnvPath,
  Rectangle,
} from "../../node/types/index.ts";
import { VideoResponse } from "../index.ts";
import {
  ConversionPagination,
  ConversionResponse,
  DownloadItem,
  DownloadItemPagination,
} from "./index.ts";

export interface ElectronApi {
  getEnvPath(): Promise<EnvPath>;
  getFavorites(): Promise<Favorite[]>;
  addFavorite(
    favorite: Omit<Favorite, "id" | "createdDate" | "updatedDate">
  ): Promise<Favorite>;
  removeFavorite(id: number): Promise<void>;
  setWebviewBounds(rect: Rectangle): Promise<void>;
  webviewGoBack(): Promise<boolean>;
  webviewReload(): Promise<void>;
  webviewLoadURL(url?: string): Promise<void>;
  webviewGoHome(): Promise<void>;
  getAppStore(): Promise<AppStore>;
  onSelectDownloadDir(): Promise<string>;
  setAppStore(
    key: keyof AppStore,
    val: AppStore[keyof AppStore]
  ): Promise<void>;
  openDir(dir?: string): Promise<void>;
  addDownloadItem(video: Omit<DownloadItem, "id">): Promise<Video>;
  addDownloadItems(videos: Omit<DownloadItem, "id">[]): Promise<Video[]>;
  getDownloadItems(p: DownloadItemPagination): Promise<VideoResponse>;
  startDownload(vid: number): Promise<void>;
  openUrl(url: string): Promise<void>;
  stopDownload(id: number): Promise<void>;
  onDownloadListContextMenu(id: number): Promise<void>;
  onFavoriteItemContextMenu(id: number): Promise<void>;
  deleteDownloadItem(id: number): Promise<void>;
  convertToAudio(id: number): Promise<void>;
  rendererEvent(
    channel: string,
    funcId: string,
    listener: (...args: unknown[]) => void // More specific than 'any'
  ): void;
  removeEventListener(channel: string, funcId: string): void;
  showBrowserWindow(): Promise<void>;
  webviewHide(): Promise<void>;
  webviewShow(): Promise<void>;
  webviewUrlContextMenu(): Promise<void>;
  downloadNow(video: Omit<DownloadItem, "id">): Promise<void>;
  downloadItemsNow(videos: Omit<DownloadItem, "id">[]): Promise<void>;
  editDownloadNow(video: DownloadItem): Promise<void>;
  combineToHomePage(store: BrowserStore): Promise<void>;
  editDownloadItem(video: DownloadItem): Promise<void>;
  getLocalIP(): Promise<string>;
  openBrowser(url: string): Promise<void>;
  selectFile(): Promise<string>;
  getSharedState(): Promise<unknown>; // Use 'unknown' for better type safety than 'any'
  setSharedState(state: unknown): Promise<void>; // Use 'unknown'
  setUserAgent(isMobile: boolean): Promise<void>;
  getDownloadLog(id: number): Promise<string>;
  showDownloadDialog(data: Omit<DownloadItem, "id">[]): Promise<unknown>; // Result depends on main process handler
  pluginReady(): Promise<void>;
  getConversions(pagination: ConversionPagination): Promise<ConversionResponse>;
  addConversion(conversion: Omit<Conversion, "id">): Promise<Conversion>;
  deleteConversion(id: number): Promise<void>;
  getMachineId(): Promise<string>;
  clearWebviewCache(): Promise<void>;
  openPlayerWindow(): Promise<void>;
  exportFavorites(): Promise<void>;
  importFavorites(): Promise<void>;
  checkUpdate(): Promise<void>;
  startUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
  exportDownloadList(): Promise<void>;
  getVideoFolders(): Promise<string[]>;
  getPageTitle(url: string): Promise<string | undefined>; // Assuming title is string or undefined
}
