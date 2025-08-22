import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DownloadStatus, DownloadItem } from '@mediago/shared/common';

/**
 * 应用状态接口定义
 */
interface AppState {
  // 应用设置
  settings: {
    downloadPath: string;
    maxConcurrentDownloads: number;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoStart: boolean;
    enableNotifications: boolean;
  };
  
  // UI 状态
  ui: {
    sidebarCollapsed: boolean;
    currentView: 'downloads' | 'favorites' | 'settings' | 'converter';
    loading: boolean;
    error: string | null;
  };
  
  // 下载状态
  downloads: {
    items: Record<number, DownloadItem>;
    activeDownloads: Set<number>;
    completedCount: number;
    failedCount: number;
    totalCount: number;
  };
  
  // 收藏夹
  favorites: {
    items: Array<{
      id: number;
      url: string;
      title: string;
      createdAt: Date;
    }>;
  };
  
  // 浏览器状态
  browser: {
    url: string;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    loading: boolean;
  };
}

/**
 * 应用 Actions 接口定义
 */
interface AppActions {
  // 设置 Actions
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetSettings: () => void;
  
  // UI Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentView: (view: AppState['ui']['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 下载 Actions
  addDownload: (download: DownloadItem) => void;
  updateDownload: (id: number, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: number) => void;
  startDownload: (id: number) => void;
  pauseDownload: (id: number) => void;
  resumeDownload: (id: number) => void;
  cancelDownload: (id: number) => void;
  clearCompletedDownloads: () => void;
  
  // 收藏夹 Actions
  addFavorite: (favorite: Omit<AppState['favorites']['items'][0], 'id' | 'createdAt'>) => void;
  removeFavorite: (id: number) => void;
  clearFavorites: () => void;
  
  // 浏览器 Actions
  setBrowserUrl: (url: string) => void;
  setBrowserTitle: (title: string) => void;
  setBrowserNavigation: (canGoBack: boolean, canGoForward: boolean) => void;
  setBrowserLoading: (loading: boolean) => void;
  
  // 工具方法
  getDownloadsByStatus: (status: DownloadStatus) => DownloadItem[];
  getActiveDownloads: () => DownloadItem[];
  getTotalProgress: () => number;
}

/**
 * 完整的 Store 类型
 */
type AppStore = AppState & AppActions;

/**
 * 默认状态
 */
const defaultState: AppState = {
  settings: {
    downloadPath: '',
    maxConcurrentDownloads: 3,
    theme: 'auto',
    language: 'zh',
    autoStart: false,
    enableNotifications: true,
  },
  
  ui: {
    sidebarCollapsed: false,
    currentView: 'downloads',
    loading: false,
    error: null,
  },
  
  downloads: {
    items: {},
    activeDownloads: new Set(),
    completedCount: 0,
    failedCount: 0,
    totalCount: 0,
  },
  
  favorites: {
    items: [],
  },
  
  browser: {
    url: '',
    title: '',
    canGoBack: false,
    canGoForward: false,
    loading: false,
  },
};

/**
 * 优化后的 Zustand Store
 * 
 * 特性：
 * - 使用 immer 简化不可变更新
 * - 集成 devtools 用于调试
 * - 持久化关键设置
 * - 类型安全的状态管理
 * - 性能优化的选择器
 */
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer<AppStore>((set, get) => ({
          ...defaultState,
          
          // 设置 Actions
          updateSettings: (newSettings) =>
            set((state) => {
              Object.assign(state.settings, newSettings);
            }),
          
          resetSettings: () =>
            set((state) => {
              state.settings = { ...defaultState.settings };
            }),
          
          // UI Actions
          setSidebarCollapsed: (collapsed) =>
            set((state) => {
              state.ui.sidebarCollapsed = collapsed;
            }),
          
          setCurrentView: (view) =>
            set((state) => {
              state.ui.currentView = view;
            }),
          
          setLoading: (loading) =>
            set((state) => {
              state.ui.loading = loading;
            }),
          
          setError: (error) =>
            set((state) => {
              state.ui.error = error;
            }),
          
          // 下载 Actions
          addDownload: (download) =>
            set((state) => {
              state.downloads.items[download.id] = download;
              state.downloads.totalCount++;
            }),
          
          updateDownload: (id, updates) =>
            set((state) => {
              if (state.downloads.items[id]) {
                Object.assign(state.downloads.items[id], updates);
                
                // 更新统计
                const item = state.downloads.items[id];
                if (updates.status) {
                  if (updates.status === DownloadStatus.Success) {
                    state.downloads.completedCount++;
                    state.downloads.activeDownloads.delete(id);
                  } else if (updates.status === DownloadStatus.Failed) {
                    state.downloads.failedCount++;
                    state.downloads.activeDownloads.delete(id);
                  } else if (updates.status === DownloadStatus.Downloading) {
                    state.downloads.activeDownloads.add(id);
                  }
                }
              }
            }),
          
          removeDownload: (id) =>
            set((state) => {
              if (state.downloads.items[id]) {
                delete state.downloads.items[id];
                state.downloads.activeDownloads.delete(id);
                state.downloads.totalCount--;
              }
            }),
          
          startDownload: (id) =>
            set((state) => {
              if (state.downloads.items[id]) {
                state.downloads.items[id].status = DownloadStatus.Downloading;
                state.downloads.activeDownloads.add(id);
              }
            }),
          
          pauseDownload: (id) =>
            set((state) => {
              if (state.downloads.items[id]) {
                state.downloads.items[id].status = DownloadStatus.Stopped;
                state.downloads.activeDownloads.delete(id);
              }
            }),
          
          resumeDownload: (id) =>
            set((state) => {
              if (state.downloads.items[id]) {
                state.downloads.items[id].status = DownloadStatus.Downloading;
                state.downloads.activeDownloads.add(id);
              }
            }),
          
          cancelDownload: (id) =>
            set((state) => {
              if (state.downloads.items[id]) {
                delete state.downloads.items[id];
                state.downloads.activeDownloads.delete(id);
                state.downloads.totalCount--;
              }
            }),
          
          clearCompletedDownloads: () =>
            set((state) => {
              Object.keys(state.downloads.items).forEach((key) => {
                const id = parseInt(key);
                const item = state.downloads.items[id];
                if (item?.status === DownloadStatus.Success) {
                  delete state.downloads.items[id];
                  state.downloads.totalCount--;
                  state.downloads.completedCount--;
                }
              });
            }),
          
          // 收藏夹 Actions
          addFavorite: (favorite) =>
            set((state) => {
              const newFavorite = {
                ...favorite,
                id: Date.now(),
                createdAt: new Date(),
              };
              state.favorites.items.push(newFavorite);
            }),
          
          removeFavorite: (id) =>
            set((state) => {
              const index = state.favorites.items.findIndex(item => item.id === id);
              if (index !== -1) {
                state.favorites.items.splice(index, 1);
              }
            }),
          
          clearFavorites: () =>
            set((state) => {
              state.favorites.items = [];
            }),
          
          // 浏览器 Actions
          setBrowserUrl: (url) =>
            set((state) => {
              state.browser.url = url;
            }),
          
          setBrowserTitle: (title) =>
            set((state) => {
              state.browser.title = title;
            }),
          
          setBrowserNavigation: (canGoBack, canGoForward) =>
            set((state) => {
              state.browser.canGoBack = canGoBack;
              state.browser.canGoForward = canGoForward;
            }),
          
          setBrowserLoading: (loading) =>
            set((state) => {
              state.browser.loading = loading;
            }),
          
          // 工具方法
          getDownloadsByStatus: (status) => {
            const { downloads } = get();
            return Object.values(downloads.items).filter(item => item.status === status);
          },
          
          getActiveDownloads: () => {
            const { downloads } = get();
            return Array.from(downloads.activeDownloads)
              .map(id => downloads.items[id])
              .filter(Boolean);
          },
          
          getTotalProgress: () => {
            const { downloads } = get();
            const activeItems = Array.from(downloads.activeDownloads)
              .map(id => downloads.items[id])
              .filter(Boolean);
            
            if (activeItems.length === 0) return 0;
            
            const totalProgress = activeItems.reduce((sum, item) => sum + (item.progress || 0), 0);
            return Math.round(totalProgress / activeItems.length);
          },
        })),
        {
          name: 'mediago-app-store',
          // 只持久化设置和 UI 状态
          partialize: (state) => ({
            settings: state.settings,
            ui: {
              sidebarCollapsed: state.ui.sidebarCollapsed,
              currentView: state.ui.currentView,
            },
          }),
        }
      ),
      {
        name: 'mediago-store',
      }
    )
  )
);

/**
 * 性能优化的选择器 Hooks
 */

// 设置选择器
export const useSettings = () => useAppStore((state) => state.settings);
export const useUpdateSettings = () => useAppStore((state) => state.updateSettings);

// UI 选择器
export const useUI = () => useAppStore((state) => state.ui);
export const useCurrentView = () => useAppStore((state) => state.ui.currentView);
export const useSetCurrentView = () => useAppStore((state) => state.setCurrentView);

// 下载选择器
export const useDownloads = () => useAppStore((state) => state.downloads.items);
export const useDownloadStats = () => useAppStore((state) => ({
  completed: state.downloads.completedCount,
  failed: state.downloads.failedCount,
  total: state.downloads.totalCount,
  active: state.downloads.activeDownloads.size,
}));
export const useDownloadActions = () => useAppStore((state) => ({
  add: state.addDownload,
  update: state.updateDownload,
  remove: state.removeDownload,
  start: state.startDownload,
  pause: state.pauseDownload,
  resume: state.resumeDownload,
  cancel: state.cancelDownload,
  clearCompleted: state.clearCompletedDownloads,
}));

// 收藏夹选择器
export const useFavorites = () => useAppStore((state) => state.favorites.items);
export const useFavoriteActions = () => useAppStore((state) => ({
  add: state.addFavorite,
  remove: state.removeFavorite,
  clear: state.clearFavorites,
}));

// 浏览器选择器
export const useBrowser = () => useAppStore((state) => state.browser);
export const useBrowserActions = () => useAppStore((state) => ({
  setUrl: state.setBrowserUrl,
  setTitle: state.setBrowserTitle,
  setNavigation: state.setBrowserNavigation,
  setLoading: state.setBrowserLoading,
}));

/**
 * 组合选择器 - 用于复杂的派生状态
 */
export const useDownloadsByStatus = (status: DownloadStatus) =>
  useAppStore((state) => state.getDownloadsByStatus(status));

export const useActiveDownloads = () =>
  useAppStore((state) => state.getActiveDownloads());

export const useTotalProgress = () =>
  useAppStore((state) => state.getTotalProgress());

/**
 * Store 调试工具
 */
export const useStoreDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      logState: () => console.log('Store State:', useAppStore.getState()),
      resetStore: () => useAppStore.setState(defaultState),
      exportState: () => JSON.stringify(useAppStore.getState(), null, 2),
    };
  }
  return {};
};