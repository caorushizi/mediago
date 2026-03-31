import { MediaGoClient, type ApiResponse } from "@mediago/core-sdk";
import type {
  ConversionPagination,
  DownloadTask,
  DownloadTaskPagination,
  MediaGoApi,
  SetupAuthRequest,
} from "@mediago/shared-common";

interface StoreValues {
  local: string;
  deleteSegments: boolean;
}

function wrapResponse<T>(
  promise: Promise<ApiResponse<T>>,
): Promise<{ code: number; data: T; message: string }> {
  return promise.then((res) => ({
    code: res.success ? 0 : res.code,
    data: res.data,
    message: res.message,
  }));
}

export interface GoAdapterHandle {
  adapter: Partial<MediaGoApi>;
  setApiKey: (key: string) => void;
}

export function createGoAdapter(
  coreUrl: string,
  getStoreValues: () => StoreValues,
  apiKey?: string,
): GoAdapterHandle {
  const client = new MediaGoClient({ baseURL: coreUrl, apiKey });

  const adapter: Partial<MediaGoApi> = {
    getFavorites: async () => {
      return wrapResponse(client.getFavorites());
    },

    addFavorite: async (favorite) => {
      return wrapResponse(
        client.addFavorite({
          title: (favorite as any).title,
          url: favorite.url,
          icon: (favorite as any).icon,
        }),
      );
    },

    removeFavorite: async (id: number) => {
      return wrapResponse(client.removeFavorite(id));
    },

    getDownloadTasks: async (p: DownloadTaskPagination) => {
      const { local } = getStoreValues();
      return wrapResponse(
        client.getDownloadTasks({
          current: p.current,
          pageSize: p.pageSize,
          filter: p.filter,
          localPath: local,
        }),
      );
    },

    createDownloadTasks: async (
      tasks: Omit<DownloadTask, "id">[],
      startDownload?: boolean,
    ) => {
      return wrapResponse(
        client.addDownloadTasks({
          tasks: tasks.map((t) => ({
            type: t.type,
            url: t.url,
            name: t.name,
            headers: t.headers,
            folder: t.folder,
          })),
          startDownload,
        }),
      );
    },

    startDownload: async (vid: number) => {
      const { local, deleteSegments } = getStoreValues();
      return wrapResponse(
        client.startDownload(vid, { localPath: local, deleteSegments }),
      );
    },

    stopDownload: async (id: number) => {
      return wrapResponse(client.stopDownload(id));
    },

    deleteDownloadTask: async (id: number) => {
      return wrapResponse(client.deleteDownloadTask(id));
    },

    updateDownloadTask: async (task: DownloadTask, startDownload?: boolean) => {
      await wrapResponse(
        client.editDownloadTask(task.id, {
          name: task.name,
          url: task.url,
          headers: task.headers ?? undefined,
          folder: task.folder,
        }),
      );
      if (startDownload) {
        const { local, deleteSegments } = getStoreValues();
        await wrapResponse(
          client.startDownload(task.id, { localPath: local, deleteSegments }),
        );
      }
      return { code: 0, data: undefined, message: "OK" } as any;
    },

    getVideoFolders: async () => {
      return wrapResponse(client.getDownloadFolders());
    },

    getDownloadLog: async (id: number) => {
      const res = await client.getDownloadLogs(id);
      return {
        code: res.success ? 0 : res.code,
        data: res.data.log,
        message: res.message,
      } as any;
    },

    getConversions: async (pagination: ConversionPagination) => {
      return wrapResponse(
        client.getConversions({
          current: pagination.current,
          pageSize: pagination.pageSize,
        }),
      );
    },

    addConversion: async (conversion) => {
      return wrapResponse(
        client.addConversion({
          name: (conversion as any).name,
          path: (conversion as any).path,
        }),
      );
    },

    deleteConversion: async (id: number) => {
      return wrapResponse(client.deleteConversion(id));
    },

    getAppStore: async () => {
      return wrapResponse(client.getConfig());
    },

    setAppStore: async (key: string, val: any) => {
      return wrapResponse(client.setConfigKey(key, val));
    },

    // Auth methods
    setupAuth: async (req: SetupAuthRequest) => {
      const res = await client.setupAuth(req.apiKey);
      if (res.success) {
        client.setApiKey(req.apiKey);
      }
      return {
        code: res.success ? 0 : res.code,
        data: res.data,
        message: res.message,
      };
    },

    signin: async (req: SetupAuthRequest) => {
      const res = await client.signin(req.apiKey);
      if (res.success && res.data) {
        // After successful signin, set the apiKey for subsequent requests
        client.setApiKey(req.apiKey);
      }
      return {
        code: res.success ? 0 : res.code,
        data: res.data,
        message: res.message,
      };
    },

    isSetup: async () => {
      return wrapResponse(client.isSetup());
    },

    // Utility methods
    getPageTitle: async (url: string) => {
      return wrapResponse(client.getPageTitle(url));
    },

    getEnvPath: async () => {
      const [envRes, configRes] = await Promise.all([
        client.getEnvPaths(),
        client.getConfig(),
      ]);
      return {
        code: 0,
        data: {
          binPath: envRes.data.binDir,
          dbPath: "",
          workspace: envRes.data.configDir,
          platform: envRes.data.platform,
          local: configRes.data.local,
          playerUrl: "",
          coreUrl: coreUrl,
        },
        message: "OK",
      } as any;
    },

    // Web-mode stubs for Electron-only features
    openUrl: async (url: string) => {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      return { code: 0, data: {}, message: "" } as any;
    },
  };

  return {
    adapter,
    setApiKey: (key: string) => client.setApiKey(key),
  };
}
