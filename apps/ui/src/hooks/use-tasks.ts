import {
  DOWNLOAD_EVENT_NAME,
  DownloadFilter,
  DownloadStatus,
  type DownloadEvent,
  type DownloadProgress,
  type DownloadSuccessEvent,
  type DownloadTask,
} from "@mediago/shared-common";
import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { downloadStoreSelector, useDownloadStore } from "@/store/download";
import useAPI from "./use-api";
import { homeSelector, useHomeStore } from "@/store/home";

/**
 * Extended Download Task with real-time details
 */
export interface DownloadTaskDetails extends DownloadTask {
  // Current download progress percentage
  percent: string;
  // Current download speed
  speed: string;
  // Whether the downloaded file still exists
  exists?: boolean;
  // Local file path
  file?: string;
}

const isSuccessEvent = (obj: DownloadEvent): obj is DownloadSuccessEvent =>
  obj.type === "success";
const isProgressEvent = (
  obj: DownloadEvent,
): obj is DownloadEvent<DownloadProgress[]> => obj.type === "progress";

type RawDownloadListener = (_: unknown, event: DownloadEvent) => void;

const globalListeners = new Set<RawDownloadListener>();
let detachGlobalListener: (() => void) | null = null;

const dispatchDownloadEvent: RawDownloadListener = (_, event) => {
  globalListeners.forEach((listener) => listener(_, event));
};

function registerGlobalDownloadListener(
  addIpcListener: (channel: string, listener: RawDownloadListener) => void,
  removeIpcListener: (channel: string, listener: RawDownloadListener) => void,
  listener: RawDownloadListener,
): () => void {
  globalListeners.add(listener);

  if (!detachGlobalListener) {
    addIpcListener(DOWNLOAD_EVENT_NAME, dispatchDownloadEvent);
    detachGlobalListener = () => {
      removeIpcListener(DOWNLOAD_EVENT_NAME, dispatchDownloadEvent);
      detachGlobalListener = null;
    };
  }

  return () => {
    globalListeners.delete(listener);
    if (globalListeners.size === 0 && detachGlobalListener) {
      detachGlobalListener();
    }
  };
}

export function useTasks(filter: DownloadFilter = DownloadFilter.list) {
  const { setEvents, eventsMap } = useDownloadStore(
    useShallow(downloadStoreSelector),
  );
  const { page, pageSize, setPage, setPageSize } = useHomeStore(
    useShallow(homeSelector),
  );
  const api = useAPI();
  const { addIpcListener, removeIpcListener, getDownloadTasks } = api;

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
    return (data?.list || []).map((item) => {
      const evnetItem = eventsMap.get(String(item.id));

      if (!evnetItem) {
        return {
          ...item,
          percent: "0",
          speed: "0 B/s",
        };
      }

      return {
        ...item,
        percent: evnetItem.percent || "0",
        speed: evnetItem.speed || "0 B/s",
      };
    });
  }, [data, eventsMap]);

  const handleDownloadEvent = useCallback(
    (_: unknown, eventData: DownloadEvent) => {
      if (isSuccessEvent(eventData)) {
        mutate(
          (current) => {
            if (!current) {
              return current;
            }

            const index = current.list.findIndex(
              (item) => item.id === eventData.data.id,
            );
            if (index === -1) {
              return current;
            }

            const nextList = [...current.list];
            nextList.splice(index, 1);

            return {
              ...current,
              list: nextList,
              total: Math.max(0, current.total - 1),
            };
          },
          { revalidate: false },
        );
        return;
      }

      if (isProgressEvent(eventData)) {
        const events = eventData.data.map((item) => ({
          percent: item.percent,
          speed: item.speed,
          id: item.id,
        }));
        setEvents(events);

        mutate(
          (current) => {
            if (!current) {
              return current;
            }

            const progressMap = new Map(
              eventData.data.map((item) => [item.id, item]),
            );
            let changed = false;
            const nextList = current.list.map((item) => {
              if (!progressMap.has(item.id)) {
                return item;
              }
              if (item.status === DownloadStatus.Downloading) {
                return item;
              }
              changed = true;
              return {
                ...item,
                status: DownloadStatus.Downloading,
              };
            });

            if (!changed) {
              return current;
            }

            return {
              ...current,
              list: nextList,
            };
          },
          { revalidate: false },
        );
      }
    },
    [mutate, setEvents],
  );

  useEffect(() => {
    const listener: RawDownloadListener = handleDownloadEvent;
    return registerGlobalDownloadListener(
      addIpcListener,
      removeIpcListener,
      listener,
    );
  }, [addIpcListener, removeIpcListener, handleDownloadEvent]);

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
