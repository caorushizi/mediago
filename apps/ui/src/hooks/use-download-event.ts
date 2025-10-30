import {
  DOWNLOAD_EVENT_NAME,
  type DownloadEvent,
  DownloadStatus,
  type DownloadSuccessEvent,
} from "@mediago/shared-common";
import { produce } from "immer";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { downloadStoreSelector, useDownloadStore } from "@/store/download";
import useAPI from "./use-api";
import { useTasks } from "./use-tasks";

const isSuccessEvent = (obj: DownloadEvent): obj is DownloadSuccessEvent =>
  obj.type === "success";
const isProgressEvent = (
  obj: DownloadEvent,
): obj is DownloadEvent<DownloadProgress[]> => obj.type === "progress";

export function useDownloadEvent() {
  const { setEvents } = useDownloadStore(useShallow(downloadStoreSelector));
  const { addIpcListener, removeIpcListener } = useAPI();
  const { data, mutate, total } = useTasks();

  useEffect(() => {
    const handleEvent = (_: unknown, eventData: DownloadEvent) => {
      console.log("Received download event:", _, eventData);
      if (isSuccessEvent(eventData)) {
        const newState = produce({ list: data, total }, (draft) => {
          const index = draft.list.findIndex(
            (item) => item.id === eventData.data.id,
          );
          if (index > -1) {
            draft.list.splice(index, 1);
            draft.total = draft.total - 1;
          }
        });
        mutate(newState);
      }
      if (isProgressEvent(eventData)) {
        const eventDataMap = new Map(
          eventData.data.map((item) => [String(item.id), item]),
        );

        const newState = produce({ list: data, total }, (draft) => {
          draft.list.forEach((item) => {
            const progressItem = eventDataMap.get(String(item.id));
            if (progressItem) {
              item.status = DownloadStatus.Downloading;
            }
          });
        });

        mutate(newState, {
          revalidate: false,
        });

        setEvents(
          eventData.data.map((item) => ({
            percent: item.percent,
            speed: item.speed,
            id: item.id,
          })),
        );
      }
    };

    addIpcListener(DOWNLOAD_EVENT_NAME, handleEvent);
    return () => {
      removeIpcListener(DOWNLOAD_EVENT_NAME, handleEvent);
    };
  }, [data, total, addIpcListener, removeIpcListener, mutate, setEvents]);
}
