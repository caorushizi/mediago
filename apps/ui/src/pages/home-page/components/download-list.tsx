import type { DownloadTask } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import { App, Empty } from "antd";
import { produce } from "immer";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DownloadForm, { type DownloadFormRef } from "@/components/download-form";
import Loading from "@/components/loading";
import { EDIT_DOWNLOAD } from "@/const";
import useAPI from "@/hooks/use-api";
import { useTasks } from "@/hooks/use-tasks";
import type { DownloadFilter } from "@/types";
import { cn, tdApp } from "@/utils";
import { DownloadTaskItem } from "./download-item";
import { ListHeader } from "./list-header";

interface Props {
  filter: DownloadFilter;
}

export function DownloadTaskList({ filter }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const {
    startDownload,
    addIpcListener,
    removeIpcListener,
    stopDownload,
    onDownloadListContextMenu,
    deleteDownloadTask,
  } = useAPI();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const editFormRef = useRef<DownloadFormRef>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false); // 追踪是否已完成首次加载
  const downloadListId = useId();
  const { mutate, isLoading, data } = useTasks(filter);

  // 追踪首次加载完成
  useEffect(() => {
    if (!isLoading && !hasInitialLoaded && data.length >= 0) {
      setHasInitialLoaded(true);
    }
  }, [isLoading, hasInitialLoaded, data.length]);

  useEffect(() => {
    const onDownloadMenuEvent = async (
      _e: unknown,
      params: { action: string; payload: number },
    ) => {
      const { action, payload } = params;

      if (action === "select") {
        setSelected((keys) => [...keys, payload]);
      } else if (action === "download") {
        onStartDownload(payload);
      } else if (action === "refresh") {
        mutate();
      } else if (action === "delete") {
        await deleteDownloadTask(payload);
        mutate();
      }
    };

    addIpcListener("download-item-event", onDownloadMenuEvent);

    return () => {
      removeIpcListener("download-item-event", onDownloadMenuEvent);

      // 清理未完成的刷新定时器
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [mutate]);

  const handleItemSelectChange = useMemoizedFn((id: number) => {
    setSelected(
      produce((draft) => {
        const index = draft.indexOf(id);
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
          draft.push(...data.map((task) => task.id));
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
    // 筛选条件变化时也重置首次加载状态，但稍作延迟以避免闪烁
    setTimeout(() => {
      setHasInitialLoaded(false);
    }, 50);
  }, [filter]);

  const onStartDownload = useMemoizedFn(async (id: number) => {
    await startDownload(id);

    message.success(t("addTaskSuccess"));
    mutate();
  });

  const onStopDownload = useMemoizedFn(async (id: number) => {
    await stopDownload(id);

    setTimeout(() => {
      mutate();
    }, 500);
  });

  const handleFormConfirm = useMemoizedFn(async () => {
    mutate();
  });

  const handleContext = useMemoizedFn((item: number) => {
    onDownloadListContextMenu(item);
  });

  const onDeleteItems = useMemoizedFn(async (ids: number[]) => {
    for (const id of ids) {
      await deleteDownloadTask(Number(id));
    }
    setSelected([]);
    mutate();
  });

  const onDownloadItems = useMemoizedFn(async (ids: number[]) => {
    for (const id of ids) {
      await startDownload(Number(id));
    }

    message.success(t("addTaskSuccess"));
    mutate();
    setSelected([]);
  });

  const onCancelItems = useMemoizedFn(async () => {
    setSelected([]);
  });

  const handleShowDownloadForm = useMemoizedFn((task: DownloadTask) => {
    tdApp.onEvent(EDIT_DOWNLOAD);
    const { id, name, url, headers, type, folder } = task;
    const values = {
      batch: false,
      id,
      name,
      url,
      headers,
      type,
      folder,
    };
    editFormRef.current?.openModal(values);
  });

  // 只有在非首次加载或首次加载完成后，且确实没有数据时才显示空状态
  if (data.length === 0 && (hasInitialLoaded || !isLoading)) {
    return (
      <div className="flex h-full flex-1 flex-row items-center justify-center rounded-lg bg-white dark:bg-[#1F2024]">
        <Empty />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <ListHeader
        selected={selected}
        checked={listChecked}
        onSelectAll={handleSelectAll}
        onDeleteItems={onDeleteItems}
        onDownloadItems={onDownloadItems}
        onCancelItems={onCancelItems}
        filter={filter}
      />
      {isLoading && !hasInitialLoaded && data.length === 0 && <Loading />}
      <div
        className={cn(
          "flex w-full flex-1 shrink-0 flex-col gap-3 overflow-auto",
        )}
      >
        {data.map((task) => {
          return (
            <DownloadTaskItem
              key={task.id}
              task={task}
              selected={selected.includes(task.id)}
              onSelectChange={handleItemSelectChange}
              onStartDownload={onStartDownload}
              onStopDownload={onStopDownload}
              onContextMenu={handleContext}
              onShowEditForm={handleShowDownloadForm}
            />
          );
        })}
      </div>
      <DownloadForm
        id={downloadListId}
        ref={editFormRef}
        isEdit
        onConfirm={handleFormConfirm}
      />
    </div>
  );
}

// Legacy export for backward compatibility
export const DownloadList = DownloadTaskList;
