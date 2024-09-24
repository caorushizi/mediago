import { cn, moment } from "@/utils";
import React, { useEffect, useMemo, useState } from "react";
import { DownloadItem } from "./DownloadItem";
import { ListHeader } from "./ListHeader";
import { produce } from "immer";
import { Empty, message, Pagination } from "antd";
import { DownloadFilter } from "@/types";
import { ListPagination } from "./types";
import useElectron from "@/hooks/electron";
import { useTranslation } from "react-i18next";
import Loading from "@/components/Loading";
import { useMemoizedFn } from "ahooks";

interface Props {
  data: DownloadItem[];
  filter: DownloadFilter;
  refresh: () => void;
  loading: boolean;
  pagination: ListPagination;
}

export function DownloadList({
  data,
  filter,
  refresh,
  loading,
  pagination,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const {
    startDownload,
    addIpcListener,
    removeIpcListener,
    stopDownload,
    onDownloadListContextMenu,
    deleteDownloadItem,
    editDownloadItem,
    editDownloadNow,
  } = useElectron();
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Record<number, DownloadProgress>>(
    {},
  );

  useEffect(() => {
    const onDownloadProgress = (e: unknown, currProgress: DownloadProgress) => {
      const nextState = produce((draft) => {
        draft[currProgress.id] = currProgress;
      });
      setProgress(nextState);
    };
    const onDownloadSuccess = () => {
      refresh();
    };
    const onDownloadFailed = () => {
      refresh();
    };
    const onDownloadStart = () => {
      refresh();
    };
    const onDownloadMenuEvent = async (
      e: unknown,
      params: { action: string; payload: number },
    ) => {
      const { action, payload } = params;

      if (action === "select") {
        setSelected((keys) => [...keys, payload]);
      } else if (action === "download") {
        onStartDownload(payload);
      } else if (action === "refresh") {
        refresh();
      } else if (action === "delete") {
        await deleteDownloadItem(payload);
        refresh();
      }
    };
    const onReceiveDownloadItem = () => {
      refresh();
    };
    const onChangeVideoIsLive = () => {
      refresh();
    };

    addIpcListener("download-progress", onDownloadProgress);
    addIpcListener("download-success", onDownloadSuccess);
    addIpcListener("download-failed", onDownloadFailed);
    addIpcListener("download-start", onDownloadStart);
    addIpcListener("download-item-event", onDownloadMenuEvent);
    addIpcListener("download-item-notifier", onReceiveDownloadItem);
    addIpcListener("change-video-is-live", onChangeVideoIsLive);

    return () => {
      removeIpcListener("download-progress", onDownloadProgress);
      removeIpcListener("download-success", onDownloadSuccess);
      removeIpcListener("download-failed", onDownloadFailed);
      removeIpcListener("download-start", onDownloadStart);
      removeIpcListener("download-item-event", onDownloadMenuEvent);
      removeIpcListener("download-item-notifier", onReceiveDownloadItem);
      removeIpcListener("change-video-is-live", onChangeVideoIsLive);
    };
  }, []);

  const handleItemSelectChange = useMemoizedFn((id: number) => {
    setSelected(
      produce((draft) => {
        const index = draft.findIndex((i) => i === id);
        if (index !== -1) {
          draft.splice(index, 1);
        } else {
          draft.push(id);
        }
      }),
    );
  });

  const handleSelectAll = () => {
    setSelected(
      produce((draft) => {
        if (draft.length) {
          draft.splice(0, draft.length);
        } else {
          draft.push(...data.map((item) => item.id));
        }
      }),
    );
  };

  const listChecked = useMemo(() => {
    if (selected.length === 0) {
      return false;
    }
    if (selected.length === data.length) {
      return true;
    }
    return "indeterminate";
  }, [selected]);

  const onStartDownload = useMemoizedFn(async (id: number) => {
    await startDownload(id);
    messageApi.success(t("addTaskSuccess"));
    refresh();
  });

  const onStopDownload = useMemoizedFn(async (id: number) => {
    await stopDownload(id);
    refresh();
  });

  const confirmAddItem = useMemoizedFn(async (values: any, now?: boolean) => {
    const item = {
      id: values.id,
      name: values.name || moment(),
      url: values.url,
      headers: values.headers,
      type: values.type,
    };

    if (now) {
      await editDownloadNow(item);
    } else {
      await editDownloadItem(item);
    }

    refresh();
    return true;
  });

  const handleContext = useMemoizedFn((item: number) => {
    onDownloadListContextMenu(item);
  });

  const onDeleteItems = async (ids: number[]) => {
    for (const id of ids) {
      await deleteDownloadItem(Number(id));
    }
    setSelected([]);
    refresh();
  };

  const onDownloadItems = async (ids: number[]) => {
    for (const id of ids) {
      await startDownload(Number(id));
    }

    messageApi.success(t("addTaskSuccess"));
    refresh();
    setSelected([]);
  };

  const onCancelItems = async () => {
    setSelected([]);
  };

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-row items-center justify-center rounded-lg bg-white">
        <Empty />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg">
      {contextHolder}
      <ListHeader
        selected={selected}
        checked={listChecked}
        onSelectAll={handleSelectAll}
        onDeleteItems={onDeleteItems}
        onDownloadItems={onDownloadItems}
        onCancelItems={onCancelItems}
      />
      {loading && <Loading />}
      <div
        className={cn(
          "flex w-full flex-1 flex-shrink-0 flex-col gap-3 overflow-auto",
        )}
      >
        {data.map((item) => {
          let currProgress;
          if (
            progress[item.id] &&
            filter === DownloadFilter.list &&
            !item.isLive
          ) {
            currProgress = progress[item.id];
          }
          return (
            <DownloadItem
              key={item.id}
              item={item}
              onSelectChange={handleItemSelectChange}
              selected={selected.includes(item.id)}
              onStartDownload={onStartDownload}
              onStopDownload={onStopDownload}
              onConfirmEdit={confirmAddItem}
              onContextMenu={handleContext}
              progress={currProgress}
            />
          );
        })}
      </div>
      <Pagination {...pagination} />
    </div>
  );
}
