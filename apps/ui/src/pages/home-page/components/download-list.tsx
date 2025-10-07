import { useDebounce, useMemoizedFn } from "ahooks";
import { App, Empty, Pagination } from "antd";
import { produce } from "immer";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DownloadForm, {
  type DownloadFormRef,
  type DownloadFormType,
} from "@/components/download-form";
import Loading from "@/components/loading";
import { EDIT_DOWNLOAD } from "@/const";
import useElectron from "@/hooks/use-electron";
import { type DownloadFilter, DownloadStatus } from "@/types";
import { cn, randomName, tdApp } from "@/utils";
import { DownloadItem } from "./download-item";
import { ListHeader } from "./list-header";
import type { ListPagination } from "./types";
import { DownloadType } from "@mediago/shared-common";

interface DownloadState {
  [key: number]: {
    id: number;
    status: DownloadStatus;
    progress: number;
    isLive?: boolean;
    messages: string[];
    name?: string;
    speed?: string;
  };
}

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
  } = useElectron();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [rawDownloadState, setRawDownloadState] = useState<DownloadState>({});
  const [downloadState, setDownloadState] = useState<DownloadState>({});
  const editFormRef = useRef<DownloadFormRef>(null);
  const lastState = useRef<DownloadState>({});
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false); // 追踪是否已完成首次加载
  const downloadListId = useId();

  // 使用防抖来优化下载状态更新，减少渲染频率
  const debouncedRawState = useDebounce(rawDownloadState, { wait: 100 }); // 减少到 100ms，提高响应性

  // 使用 useMemo 来优化状态合并计算
  const optimizedDownloadState = useMemo(() => {
    const result: DownloadState = {};

    // 合并当前状态和之前的状态，确保所有活动的下载任务都保留
    const allIds = new Set([
      ...Object.keys(debouncedRawState).map(Number),
      ...Object.keys(lastState.current).map(Number),
    ]);

    for (const numId of allIds) {
      const currentState = debouncedRawState[numId];
      const lastSent = lastState.current[numId];

      if (currentState) {
        // 有当前状态，检查是否需要更新UI
        if (
          !lastSent ||
          lastSent.status !== currentState.status ||
          lastSent.isLive !== currentState.isLive ||
          Math.abs((lastSent.progress || 0) - currentState.progress) >= 1 || // 降回到 1% 的进度阈值，保证平滑显示
          lastSent.speed !== currentState.speed ||
          (lastSent.messages?.length || 0) !== currentState.messages.length
        ) {
          result[numId] = currentState;
        } else {
          // 保持之前的状态以避免不必要的更新
          result[numId] = lastSent;
        }
      } else if (lastSent) {
        // 没有当前状态但有历史状态
        // 如果历史状态是正在下载中的状态，可能已经完成，不再显示
        // 但是 Ready 和 Watting 状态应该保留，因为它们表示等待中
        const isCompletedDownloading =
          lastSent.status === DownloadStatus.Downloading;

        // 保留所有非正在下载中的状态（包括等待中、已完成、失败等）
        if (!isCompletedDownloading) {
          result[numId] = lastSent;
        }
      }
    }

    return result;
  }, [debouncedRawState]);

  // 当优化后的状态变化时更新最终状态
  useEffect(() => {
    setDownloadState(optimizedDownloadState);
    lastState.current = optimizedDownloadState;
  }, [optimizedDownloadState]);

  // 追踪首次加载完成
  useEffect(() => {
    if (!loading && !hasInitialLoaded && data.length >= 0) {
      setHasInitialLoaded(true);
    }
  }, [loading, hasInitialLoaded, data.length]);

  useEffect(() => {
    const onDownloadStateUpdate = (_e: unknown, state: DownloadState) => {
      console.log("onDownloadStateUpdate", state);

      // 使用防抖的原始状态更新，避免频繁更新
      setRawDownloadState((prevState) => {
        // 合并新状态和旧状态，确保所有下载任务都保留
        const mergedState = { ...prevState };

        // 更新或添加新状态
        for (const [id, newItem] of Object.entries(state)) {
          mergedState[Number(id)] = newItem;
        }

        // 检查是否需要刷新列表（只在关键状态变化时才刷新）
        let shouldRefresh = false;
        const newStateEntries = Object.entries(state);

        // 如果有新的下载任务或任务数量变化，需要刷新列表
        const hasNewTasks = newStateEntries.some(
          ([id]) => !prevState[Number(id)]
        );
        if (hasNewTasks) {
          shouldRefresh = true;
        } else {
          // 检查关键状态变化时才刷新列表
          for (const [id, newItem] of newStateEntries) {
            const oldItem = prevState[Number(id)];
            const statusChanged = oldItem?.status !== newItem.status;

            if (statusChanged) {
              // 关键状态变化都需要刷新列表
              const isImportantStateChange =
                // 变为终态（成功、失败、停止）
                newItem.status === DownloadStatus.Success ||
                newItem.status === DownloadStatus.Failed ||
                newItem.status === DownloadStatus.Stopped ||
                // 从终态变为其他状态（重新开始下载）
                (oldItem &&
                  (oldItem.status === DownloadStatus.Success ||
                    oldItem.status === DownloadStatus.Failed ||
                    oldItem.status === DownloadStatus.Stopped)) ||
                // 开始下载状态变化
                newItem.status === DownloadStatus.Downloading ||
                oldItem?.status === DownloadStatus.Downloading ||
                // 暂停状态变化
                newItem.status === DownloadStatus.Stopped ||
                oldItem?.status === DownloadStatus.Stopped ||
                // 等待状态变化 - 重要：确保等待中状态能正确显示
                newItem.status === DownloadStatus.Ready ||
                newItem.status === DownloadStatus.Watting ||
                oldItem?.status === DownloadStatus.Ready ||
                oldItem?.status === DownloadStatus.Watting;

              if (isImportantStateChange) {
                shouldRefresh = true;
                break;
              }
            }
          }
        }

        // 延迟刷新以避免在渲染过程中调用，并防止重复刷新
        if (shouldRefresh) {
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          refreshTimeoutRef.current = setTimeout(() => {
            refresh();
            refreshTimeoutRef.current = null;
          }, 200); // 减少延迟时间，让状态变化更快反映到UI
        }

        return mergedState;
      });
    };

    const onDownloadMenuEvent = async (
      _e: unknown,
      params: { action: string; payload: number }
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

    addIpcListener("test", (_e: unknown, data: string) => {
      console.log("test", data);
    });
    addIpcListener("download-state-update", onDownloadStateUpdate);
    addIpcListener("download-item-event", onDownloadMenuEvent);

    return () => {
      removeIpcListener("download-state-update", onDownloadStateUpdate);
      removeIpcListener("download-item-event", onDownloadMenuEvent);

      // 清理未完成的刷新定时器
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [refresh]);

  const handleItemSelectChange = useMemoizedFn((id: number) => {
    setSelected(
      produce((draft) => {
        const index = draft.findIndex((i) => i === id);
        if (index !== -1) {
          draft.splice(index, 1);
        } else {
          draft.push(id);
        }
      })
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
      })
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

    // 立即更新本地状态，确保按钮状态快速响应
    setRawDownloadState((prevState) => ({
      ...prevState,
      [id]: {
        ...prevState[id],
        status: DownloadStatus.Downloading,
        progress: prevState[id]?.progress ?? 0, // 确保 progress 字段存在
        messages: prevState[id]?.messages ?? [],
      },
    }));

    message.success(t("addTaskSuccess"));
    setTimeout(refresh, 100);
  });

  const onStopDownload = useMemoizedFn(async (id: number) => {
    await stopDownload(id);

    // 立即更新本地状态，确保按钮状态快速响应
    setRawDownloadState((prevState) => ({
      ...prevState,
      [id]: {
        ...prevState[id],
        status: DownloadStatus.Stopped,
        progress: prevState[id]?.progress ?? 0, // 确保 progress 字段存在
        messages: prevState[id]?.messages ?? [],
      },
    }));

    // 延迟刷新确保数据一致性
    setTimeout(refresh, 100);
  });

  const confirmAddItem = useMemoizedFn(
    async (values: DownloadFormType, now?: boolean) => {
      const {
        id = 0,
        name = "",
        url = "",
        headers,
        type = DownloadType.direct,
        folder,
      } = values;
      const item = {
        id,
        name: name || randomName(),
        url,
        headers,
        type,
        folder,
      };

      await editDownloadItem(item, now);

      refresh();
      return true;
    }
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
    editFormRef.current?.openModal(values);
  });

  // 只有在非首次加载或首次加载完成后，且确实没有数据时才显示空状态
  if (data.length === 0 && (hasInitialLoaded || !loading)) {
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
      {loading && !hasInitialLoaded && data.length === 0 && <Loading />}
      <div
        className={cn(
          "flex w-full flex-1 flex-shrink-0 flex-col gap-3 overflow-auto"
        )}
      >
        {data.map((item) => {
          const state = downloadState[item.id];
          return (
            <DownloadItem
              key={item.id}
              item={item}
              selected={selected.includes(item.id)}
              onSelectChange={handleItemSelectChange}
              onStartDownload={onStartDownload}
              onStopDownload={onStopDownload}
              onContextMenu={handleContext}
              onShowEditForm={handleShowDownloadForm}
              downloadStatus={state?.status}
              progress={
                state
                  ? {
                      id: item.id,
                      percent: (state.progress ?? 0).toString(),
                      speed: state.speed || "0 MB/s",
                      isLive: state.isLive || false,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
      <Pagination
        className="flex justify-end"
        {...pagination}
        showSizeChanger={false}
      />
      <DownloadForm
        id={downloadListId}
        ref={editFormRef}
        isEdit
        onAddToList={(values) => confirmAddItem(values)}
        onDownloadNow={(values) => confirmAddItem(values, true)}
      />
    </div>
  );
}
