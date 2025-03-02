import { cn, randomName, tdApp } from "@/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DownloadItem } from "./DownloadItem";
import { ListHeader } from "./ListHeader";
import { produce } from "immer";
import { App, Empty, Pagination } from "antd";
import { DownloadFilter } from "@/types";
import { ListPagination } from "./types";
import useElectron from "@/hooks/useElectron";
import { useTranslation } from "react-i18next";
import Loading from "@/components/Loading";
import { useMemoizedFn } from "ahooks";
import DownloadForm, {
  DownloadFormRef,
  DownloadFormType,
} from "@/components/DownloadForm";
import { EDIT_DOWNLOAD } from "@/const";

interface Props {
  data: VideoStat[];
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
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Record<number, DownloadProgress>>(
    {},
  );
  const editFormRef = useRef<DownloadFormRef>(null);

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

  const handleSelectAll = useMemoizedFn(() => {
    setSelected(
      produce((draft) => {
        if (draft.length) {
          draft.splice(0, draft.length);
        } else {
          draft.push(...data.map((item) => item.id));
        }
      }),
    );
  });

  const listChecked = useMemo(() => {
    if (selected.length === 0) {
      return false;
    }
    if (selected.length === data.length) {
      return true;
    }
    return "indeterminate";
  }, [selected, data.length]);

  useEffect(() => {
    setSelected([]);
  }, [filter]);

  const onStartDownload = useMemoizedFn(async (id: number) => {
    await startDownload(id);
    message.success(t("addTaskSuccess"));
    refresh();
  });

  const onStopDownload = useMemoizedFn(async (id: number) => {
    await stopDownload(id);
    refresh();
  });

  const confirmAddItem = useMemoizedFn(
    async (values: DownloadFormType, now?: boolean) => {
      const { id, name = "", url, headers, type, folder } = values;
      const item = {
        id,
        name: name || randomName(),
        url,
        headers,
        type,
        folder,
      };

      if (now) {
        await editDownloadNow(item);
      } else {
        await editDownloadItem(item);
      }

      refresh();
      return true;
    },
  );

  const handleContext = useMemoizedFn((item: number) => {
    onDownloadListContextMenu(item);
  });

  const onDeleteItems = useMemoizedFn(async (ids: number[]) => {
    for (const id of ids) {
      await deleteDownloadItem(Number(id));
    }
    setSelected([]);
    refresh();
  });

  const onDownloadItems = useMemoizedFn(async (ids: number[]) => {
    for (const id of ids) {
      await startDownload(Number(id));
    }

    message.success(t("addTaskSuccess"));
    refresh();
    setSelected([]);
  });

  const onCancelItems = useMemoizedFn(async () => {
    setSelected([]);
  });

  const handleShowDownloadForm = useMemoizedFn((item: DownloadItem) => {
    tdApp.onEvent(EDIT_DOWNLOAD);
    const { id, name, url, headers, type, folder } = item;
    const values = {
      batch: false,
      id,
      name,
      url,
      headers,
      type,
      folder,
    };
    editFormRef.current.openModal(values);
  });

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-row items-center justify-center rounded-lg bg-white dark:bg-[#1F2024]">
        <Empty />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg">
      <ListHeader
        selected={selected}
        checked={listChecked}
        onSelectAll={handleSelectAll}
        onDeleteItems={onDeleteItems}
        onDownloadItems={onDownloadItems}
        onCancelItems={onCancelItems}
        filter={filter}
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
              onContextMenu={handleContext}
              progress={currProgress}
              onShowEditForm={handleShowDownloadForm}
            />
          );
        })}
      </div>
      <Pagination {...pagination} />

      <DownloadForm
        id="download-list"
        ref={editFormRef}
        key={"edit"}
        isEdit
        onAddToList={(values) => confirmAddItem(values)}
        onDownloadNow={(values) => confirmAddItem(values, true)}
      />
    </div>
  );
}
