import { http } from "@/utils";
import type {
  DownloadTask,
  DownloadTaskPagination,
} from "@mediago/shared-common";

export const getDownloadTasksKey = "/api/downloads";
export const getDownloadTasks = (p: DownloadTaskPagination) =>
  http.get(getDownloadTasksKey, {
    params: {
      current: p.current,
      pageSize: p.pageSize,
      filter: p.filter,
    },
  });

export const createDownloadTasks = (
  tasks: Omit<DownloadTask, "id">[],
  startDownload?: boolean,
) => http.post("/api/downloads", { tasks, startDownload });

export const startDownload = (
  id: number,
  params: { localPath: string; deleteSegments: boolean },
) => http.post(`/api/downloads/${id}/start`, params);

export const stopDownload = (id: number) =>
  http.post(`/api/downloads/${id}/stop`);

export const deleteDownloadTask = (id: number) =>
  http.delete(`/api/downloads/${id}`);

export const editDownloadTask = (id: number, data: Partial<DownloadTask>) =>
  http.put(`/api/downloads/${id}`, data);

export const getDownloadLog = (id: number) =>
  http.get(`/api/downloads/${id}/logs`);

export const getDownloadFolders = () => http.get("/api/downloads/folders");

export const exportDownloadList = () => http.get("/api/downloads/export");

export const updateDownloadStatus = (ids: number[], status: number) =>
  http.put("/api/downloads/status", { ids, status });

export const getActiveTasks = () => http.get("/api/downloads/active");

export const updateIsLive = (id: number, isLive: boolean) =>
  http.put(`/api/downloads/${id}/live`, { isLive });
