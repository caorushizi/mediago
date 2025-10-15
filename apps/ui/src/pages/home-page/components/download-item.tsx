import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
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
import { appStoreSelector, useAppStore } from "@/store/app";
import { DownloadStatus } from "@/types";
import { cn, fromatDateTime, tdApp } from "@/utils";
import { TerminalDrawer } from "./terminal-drawer";

interface Props {
  item: VideoStat;
  onSelectChange: (id: number) => void;
  selected: boolean;
  onStartDownload: (id: number) => void;
  onStopDownload: (item: number) => void;
  onContextMenu: (item: number) => void;
  progress?: DownloadProgress;
  onShowEditForm?: (value: DownloadItem) => void;
  downloadStatus?: DownloadStatus;
}

export const DownloadItem = ({
  item,
  onSelectChange,
  selected,
  onStartDownload,
  onStopDownload,
  onContextMenu,
  onShowEditForm,
  downloadStatus,
  progress,
}: Props) => {
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();

  // Derive current status; no need for memoization here
  const currStatus = downloadStatus ?? item.status;

  // Handlers
  const handlePlay = useMemoizedFn(() => {
    // FIXME: 播放器接入
    tdApp.onEvent(PLAY_VIDEO);
  });

  const startWithEvent = useMemoizedFn((eventName: string) => {
    onStartDownload(item.id);
    tdApp.onEvent(eventName);
  });

  const handleStop = useMemoizedFn(() => {
    onStopDownload(item.id);
    tdApp.onEvent(STOP_DOWNLOAD);
  });

  // Action buttons by status (consolidated for clarity)
  const actionButtons = useMemo<ReactNode[]>(() => {
    const buttons: ReactNode[] = [];

    const terminalBtn =
      appStore.showTerminal ? (
        <TerminalDrawer
          key="terminal"
          trigger={<IconButton key="terminal" title={t("terminal")} icon={<TerminalIcon />} />}
          title={item.name}
          id={item.id}
          log={item.log || ""}
        />
      ) : null;

    const editBtn = (
      <IconButton key="edit" title={t("edit")} icon={<EditIcon />} onClick={() => onShowEditForm?.(item)} />
    );

    switch (currStatus) {
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
        buttons.push(
          <IconButton key="stop" title={t("pause")} icon={<PauseCircleOutlined />} onClick={handleStop} />,
        );
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
            disabled={!item.exists}
            onClick={handlePlay}
          />,
        );
        break;
    }

    return buttons;
  }, [
    appStore.showTerminal,
    currStatus,
    handlePlay,
    handleStop,
    item.exists,
    item.id,
    item.log,
    item.name,
    onShowEditForm,
    startWithEvent,
    t,
  ]);

  const renderTitle = useMemoizedFn((item: VideoStat): ReactNode => {
    return (
      <div
        className={cn("truncate text-sm dark:text-[#B4B4B4]", {
          "text-[#127af3]": selected,
        })}
        title={item.name}
      >
        {item.folder ? `${item.folder}/` : item.folder}
        {item.name}
      </div>
    );
  });

  const tags = useMemo<ReactNode[]>(() => {
    const list: ReactNode[] = [];
    if (item.isLive) list.push(<DownloadTag key="live" text={t("liveResource")} color="#9abbe2" />);

    switch (currStatus) {
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
        if (!item.exists) {
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
            title={item.name}
            id={item.id}
            log={item.log || ""}
          />,
        );
        break;
      case DownloadStatus.Stopped:
        list.push(<DownloadTag key="pause" icon={<PauseIcon />} text={t("downloadPause")} color="#9abbe2" />);
        break;
    }
    return list;
  }, [currStatus, item.exists, item.id, item.isLive, item.log, item.name, t]);

  const renderDescription = useMemoizedFn((item: DownloadItem): ReactNode => {
    if (progress) {
      const { percent, speed } = progress;
      const val = Math.round(Number(percent));

      return (
        <div className="flex flex-row items-center gap-2 text-xs text-[rgba(0,0,0,0.88)] dark:text-[rgba(255,255,255,0.85)]">
          <Progress percent={val} strokeLinecap="butt" showInfo={false} />
          <div className="min-w-5 shrink-0">{val}%</div>
          <div className="min-w-20 shrink-0">{speed}</div>
        </div>
      );
    }
    return (
      <div className="relative flex flex-col gap-1 text-xs text-[#B3B3B3] dark:text-[#515257]" title={item.url}>
        <div className="truncate">{item.url}</div>
        <div className="truncate">
          {t("createdAt")} {fromatDateTime(item.createdDate)}
        </div>
        {currStatus === DownloadStatus.Failed && (
          <TerminalDrawer
            asChild
            trigger={
              <div className="cursor-pointer truncate text-[#ff7373] dark:text-[rgba(255,115,115,0.6)]">
                {t("failReason")}: ... {item.log?.slice(-100)}
              </div>
            }
            title={item.name}
            id={item.id}
            log={item.log || ""}
          />
        )}
      </div>
    );
  });

  return (
    <div
      className={cn("relative flex flex-row gap-3 rounded-lg bg-[#FAFCFF] px-3 pb-3.5 pt-2 dark:bg-[#27292F]", {
        "bg-linear-to-r from-[#D0E8FF] to-[#F2F7FF] dark:from-[#27292F] dark:to-[#00244E]": selected,
        "opacity-70": currStatus === DownloadStatus.Success && !item.exists,
      })}
      onContextMenu={() => onContextMenu(item.id)}
    >
      <Checkbox className="mt-2" checked={selected} onCheckedChange={() => onSelectChange(item.id)} />
      <div className={cn("flex flex-1 flex-col gap-1 overflow-hidden")}>
        {selected && (
          <img alt="" src={selectedBg} className="absolute bottom-0 right-[126px] top-0 block h-full select-none" />
        )}
        <div className="relative flex flex-row items-center gap-2">
          {renderTitle(item)}
          <div className="flex shrink-0 grow flex-row gap-2">{tags}</div>
          <div className="flex flex-row items-center gap-3 rounded-md bg-[#eff4fa] px-1.5 py-1.5 dark:bg-[#3B3F48]">
            {actionButtons}
          </div>
        </div>
        {renderDescription(item)}
      </div>
    </div>
  );
};