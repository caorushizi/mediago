import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { DownloadTask, DownloadTaskWithFile } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import { Progress } from "antd";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import selectedBg from "@/assets/images/select-item-bg.png";
import { DownloadIcon, DownloadListIcon, EditIcon, FailedIcon, PauseIcon, TerminalIcon } from "@/assets/svg";
import { DownloadTag } from "@/components/download-tag";
import { IconButton } from "@/components/icon-button";
import { Checkbox } from "@/components/ui/checkbox";
import { CONTINUE_DOWNLOAD, DOWNLOAD_NOW, PLAY_VIDEO, RESTART_DOWNLOAD, STOP_DOWNLOAD } from "@/const";
import type { DownloadTaskDetails } from "@/hooks/use-tasks";
import { appStoreSelector, useAppStore } from "@/store/app";
import { DownloadStatus } from "@/types";
import { cn, fromatDateTime, tdApp } from "@/utils";
import { TerminalDrawer } from "./terminal-drawer";
import useAPI from "@/hooks/use-api";

interface Props {
  task: DownloadTaskDetails;
  onSelectChange: (id: number) => void;
  selected: boolean;
  onStartDownload: (id: number) => void;
  onStopDownload: (taskId: number) => void;
  onContextMenu: (taskId: number) => void;
  progress?: DownloadProgress;
  onShowEditForm?: (value: DownloadTask) => void;
  downloadStatus?: DownloadStatus;
}

export const DownloadTaskItem = ({
  task,
  onSelectChange,
  selected,
  onStartDownload,
  onStopDownload,
  onContextMenu,
  onShowEditForm,
}: Props) => {
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();
  const { openUrl } = useAPI();

  // Handlers
  const handlePlay = useMemoizedFn(() => {
    // FIXME: 播放器接入
    tdApp.onEvent(PLAY_VIDEO);
    openUrl("http://localhost:9800/");
  });

  const startWithEvent = useMemoizedFn((eventName: string) => {
    onStartDownload(task.id);
    tdApp.onEvent(eventName);
  });

  const handleStop = useMemoizedFn(() => {
    onStopDownload(task.id);
    tdApp.onEvent(STOP_DOWNLOAD);
  });

  // Action buttons by status (consolidated for clarity)
  const actionButtons = useMemo<ReactNode[]>(() => {
    const buttons: ReactNode[] = [];

    const terminalBtn = appStore.showTerminal ? (
      <TerminalDrawer
        key="terminal"
        trigger={<IconButton key="terminal" title={t("terminal")} icon={<TerminalIcon />} />}
        title={task.name}
        id={task.id}
        log={task.log || ""}
      />
    ) : null;

    const editBtn = (
      <IconButton key="edit" title={t("edit")} icon={<EditIcon />} onClick={() => onShowEditForm?.(task)} />
    );

    switch (task.status) {
      case DownloadStatus.Ready:
        terminalBtn && buttons.push(terminalBtn);
        buttons.push(editBtn);
        buttons.push(
          <IconButton
            key="download"
            icon={<DownloadListIcon />}
            title={t("download")}
            onClick={() => startWithEvent(DOWNLOAD_NOW)}
          />,
        );
        break;
      case DownloadStatus.Downloading:
        terminalBtn && buttons.push(terminalBtn);
        buttons.push(<IconButton key="stop" title={t("pause")} icon={<PauseCircleOutlined />} onClick={handleStop} />);
        break;
      case DownloadStatus.Failed:
        terminalBtn && buttons.push(terminalBtn);
        buttons.push(editBtn);
        buttons.push(
          <IconButton
            key="redownload"
            title={t("redownload")}
            icon={<DownloadListIcon />}
            onClick={() => startWithEvent(RESTART_DOWNLOAD)}
          />,
        );
        break;
      case DownloadStatus.Watting:
        buttons.push(<span key="watting">{t("watting")}</span>);
        break;
      case DownloadStatus.Stopped:
        terminalBtn && buttons.push(terminalBtn);
        buttons.push(editBtn);
        buttons.push(
          <IconButton
            key="restart"
            icon={<DownloadListIcon />}
            title={t("continueDownload")}
            onClick={() => startWithEvent(CONTINUE_DOWNLOAD)}
          />,
        );
        break;
      default:
        // Success
        buttons.push(
          <IconButton
            key="play"
            icon={<PlayCircleOutlined />}
            title={t("playVideo")}
            disabled={!task.exists}
            onClick={handlePlay}
          />,
        );
        break;
    }

    return buttons;
  }, [appStore.showTerminal, handlePlay, handleStop, task, onShowEditForm, startWithEvent, t]);

  const renderTitle = useMemoizedFn((task: DownloadTaskWithFile): ReactNode => {
    return (
      <div
        className={cn("truncate text-sm dark:text-[#B4B4B4]", {
          "text-[#127af3]": selected,
        })}
        title={task.name}
      >
        {task.folder ? `${task.folder}/` : task.folder}
        {task.name}
      </div>
    );
  });

  const tags = useMemo<ReactNode[]>(() => {
    const list: ReactNode[] = [];
    if (task.isLive) list.push(<DownloadTag key="live" text={t("liveResource")} color="#9abbe2" />);

    switch (task.status) {
      case DownloadStatus.Downloading:
        list.push(
          <DownloadTag
            key="downloading"
            icon={<DownloadIcon fill="#fff" width={14} height={14} />}
            text={t("downloading")}
            color="#127af3"
          />,
        );
        break;
      case DownloadStatus.Success:
        list.push(<DownloadTag key="success" text={t("downloadSuccess")} color="#09ce87" />);
        if (!task.exists) {
          list.push(<DownloadTag key="notExists" text={t("fileNotExist")} color="#9abbe2" />);
        }
        break;
      case DownloadStatus.Failed:
        list.push(
          <TerminalDrawer
            key="failed"
            trigger={
              <DownloadTag
                icon={<FailedIcon />}
                text={t("downloadFailed")}
                color="#ff7373"
                className="cursor-pointer"
              />
            }
            title={task.name}
            id={task.id}
            log={task.log || ""}
          />,
        );
        break;
      case DownloadStatus.Stopped:
        list.push(<DownloadTag key="pause" icon={<PauseIcon />} text={t("downloadPause")} color="#9abbe2" />);
        break;
    }
    return list;
  }, [task, t]);

  const renderDescription = useMemoizedFn((task: DownloadTaskDetails): ReactNode => {
    if (task.percent && task.status === DownloadStatus.Downloading) {
      const val = Math.round(Number(task.percent));

      return (
        <div className="flex flex-row items-center gap-2 text-xs text-[rgba(0,0,0,0.88)] dark:text-[rgba(255,255,255,0.85)]">
          <Progress percent={val} strokeLinecap="butt" showInfo={false} />
          <div className="min-w-5 shrink-0">{val}%</div>
          <div className="min-w-20 shrink-0">{task.speed}</div>
        </div>
      );
    }
    return (
      <div className="relative flex flex-col gap-1 text-xs text-[#B3B3B3] dark:text-[#515257]" title={task.url}>
        <div className="truncate">{task.url}</div>
        <div className="truncate">
          {t("createdAt")} {fromatDateTime(task.createdDate)}
        </div>
        {task.status === DownloadStatus.Failed && (
          <TerminalDrawer
            asChild
            trigger={
              <div className="cursor-pointer truncate text-[#ff7373] dark:text-[rgba(255,115,115,0.6)]">
                {t("failReason")}: ... {task.log?.slice(-100)}
              </div>
            }
            title={task.name}
            id={task.id}
            log={task.log || ""}
          />
        )}
      </div>
    );
  });

  return (
    <div
      className={cn("relative flex flex-row gap-3 rounded-lg bg-[#FAFCFF] px-3 pb-3.5 pt-2 dark:bg-[#27292F]", {
        "bg-linear-to-r from-[#D0E8FF] to-[#F2F7FF] dark:from-[#27292F] dark:to-[#00244E]": selected,
        "opacity-70": task.status === DownloadStatus.Success && !task.exists,
      })}
      onContextMenu={() => onContextMenu(task.id)}
    >
      <Checkbox className="mt-2" checked={selected} onCheckedChange={() => onSelectChange(task.id)} />
      <div className={cn("flex flex-1 flex-col gap-1 overflow-hidden")}>
        {selected && (
          <img alt="" src={selectedBg} className="absolute bottom-0 right-[126px] top-0 block h-full select-none" />
        )}
        <div className="relative flex flex-row items-center gap-2">
          {renderTitle(task)}
          <div className="flex shrink-0 grow flex-row gap-2">{tags}</div>
          <div className="flex flex-row items-center gap-3 rounded-md bg-[#eff4fa] px-1.5 py-1.5 dark:bg-[#3B3F48]">
            {actionButtons}
          </div>
        </div>
        {renderDescription(task)}
      </div>
    </div>
  );
};
