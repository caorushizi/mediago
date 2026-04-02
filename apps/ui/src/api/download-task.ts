import { http } from "@/utils";
import { useAppStore } from "@/store/app";
import type {
  DownloadTask,
  DownloadTaskPagination,
  DownloadTaskResponse,
  Video,
} from "@mediago/shared-common";

export const getDownloadTasksKey = "/api/downloads";
export const getDownloadTasks = (
  p: DownloadTaskPagination,
): Promise<DownloadTaskResponse> => {
  const { local } = useAppStore.getState();
  return http.get(getDownloadTasksKey, {
    params: {
      current: p.current,
      pageSize: p.pageSize,
      filter: p.filter,
      localPath: local,
    },
  });
};

export const createDownloadTasks = (
  tasks: Omit<DownloadTask, "id">[],
  startDownload?: boolean,
): Promise<Video[]> => http.post("/api/downloads", { tasks, startDownload });

export const startDownload = (id: number): Promise<void> => {
  const { local, deleteSegments } = useAppStore.getState();
  return http.post(`/api/downloads/${id}/start`, {
    localPath: local,
    deleteSegments,
  });
};

export const stopDownload = (id: number): Promise<void> =>
  http.post(`/api/downloads/${id}/stop`);

export const deleteDownloadTask = (id: number): Promise<void> =>
  http.delete(`/api/downloads/${id}`);

export const editDownloadTask = (
  id: number,
  data: Partial<DownloadTask>,
): Promise<Video> => http.put(`/api/downloads/${id}`, data);

export const getDownloadLog = (
  id: number,
): Promise<{ id: number; log: string }> =>
  http.get(`/api/downloads/${id}/logs`);

export const getDownloadFolders = (): Promise<string[]> =>
  http.get("/api/downloads/folders");

export const exportDownloadList = (): Promise<string> =>
  http.get("/api/downloads/export");

export const updateDownloadStatus = (
  ids: number[],
  status: number,
): Promise<void> => http.put("/api/downloads/status", { ids, status });

export const getActiveTasks = (): Promise<Video[]> =>
  http.get("/api/downloads/active");

export const updateIsLive = (id: number, isLive: boolean): Promise<Video> =>
  http.put(`/api/downloads/${id}/live`, { isLive });
