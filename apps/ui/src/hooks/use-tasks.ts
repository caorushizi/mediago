import { DownloadFilter } from "@mediago/shared-common";
import { useMemo, useState } from "react";
import useSWR from "swr";
import useAPI from "./use-api";
import { downloadStoreSelector, useDownloadStore } from "@/store/download";
import { useShallow } from "zustand/react/shallow";

/**
 * Extended Download Task with real-time details
 */
export interface DownloadTaskDetails extends DownloadTask {
  // Current download progress percentage
  percent: string;
  // Current download speed
  speed: string;
  // Whether the downloaded file still exists
  exists: boolean;
}

export function useTasks(filter: DownloadFilter = DownloadFilter.list) {
  const { eventsMap } = useDownloadStore(useShallow(downloadStoreSelector));
  const { getDownloadTasks } = useAPI();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, error, isLoading, mutate } = useSWR(
    {
      key: "api/tasks",
      args: {
        current: page,
        pageSize,
        filter,
      },
    },
    ({ args }) => {
      return getDownloadTasks(args);
    },
  );

  const detail: DownloadTaskDetails[] = useMemo(() => {
    console.log("useTasks detail", eventsMap, data);
    return (data?.list || []).map((item) => {
      const evnetItem = eventsMap.get(String(item.id));
      console.log("Mapping item", item.id, evnetItem, eventsMap);

      if (!evnetItem) {
        return {
          ...item,
          percent: "0",
          speed: "0 B/s",
          exists: false,
        };
      }

      return {
        ...item,
        percent: evnetItem.percent || "0",
        speed: evnetItem.speed || "0 B/s",
        exists: false,
      };
    });
  }, [data, eventsMap]);

  return {
    data: detail,
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
    pagination: {
      page,
      pageSize,
    },
    setPage,
    setPageSize,
  };
}
