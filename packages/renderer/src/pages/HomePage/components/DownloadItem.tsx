import { cn, tdApp, fromatDateTime } from "@/utils";
import React, { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DownloadStatus } from "@/types";
import { Progress } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import selectedBg from "@/assets/images/select-item-bg.png";
import {
  DownloadIcon,
  DownloadListIcon,
  EditIcon,
  FailedIcon,
  PauseIcon,
  TerminalIcon,
} from "@/assets/svg";
import useElectron from "@/hooks/useElectron";
import { DownloadTag } from "@/components/DownloadTag";
import { IconButton } from "@/components/IconButton";
import { useMemoizedFn } from "ahooks";
import {
  CONTINUE_DOWNLOAD,
  DOWNLOAD_NOW,
  PLAY_VIDEO,
  RESTART_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@/const";
import { TerminalDrawer } from "./TerminalDrawer";
import { useAppStore, appStoreSelector } from "@/store/app";
import { useShallow } from "zustand/react/shallow";

interface Props {
  item: VideoStat;
  onSelectChange: (id: number) => void;
  selected: boolean;
  onStartDownload: (id: number) => void;
  onStopDownload: (item: number) => void;
  onContextMenu: (item: number) => void;
  progress?: DownloadProgress;
  onShowEditForm?: (value: DownloadItem) => void;
}

export function DownloadItem({
  item,
  onSelectChange,
  selected,
  onStartDownload,
  onStopDownload,
  onContextMenu,
  onShowEditForm,
  progress,
}: Props) {
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();
  const { openPlayerWindow } = useElectron();

  const renderTerminalBtn = useMemoizedFn((item: DownloadItem) => {
    if (!appStore.showTerminal) return null;

    return (
      <TerminalDrawer
        key={"terminal"}
        trigger={
          <IconButton
            key="terminal"
            title={t("terminal")}
            icon={<TerminalIcon />}
          />
        }
        title={item.name}
        id={item.id}
        log={item.log}
      />
    );
  });

  // Edit form
  const renderEditIconBtn = useMemoizedFn((item: DownloadItem) => {
    return (
      <IconButton
        title={t("edit")}
        icon={<EditIcon />}
        onClick={() => onShowEditForm(item)}
      />
    );
  });

  const handlePlay = useMemoizedFn(() => {
    openPlayerWindow();
    tdApp.onEvent(PLAY_VIDEO);
  });

  const handleDownloadNow = useMemoizedFn(() => {
    onStartDownload(item.id);
    tdApp.onEvent(DOWNLOAD_NOW);
  });

  const handleRestart = useMemoizedFn(() => {
    onStartDownload(item.id);
    tdApp.onEvent(RESTART_DOWNLOAD);
  });

  const handleContinue = useMemoizedFn(() => {
    onStartDownload(item.id);
    tdApp.onEvent(CONTINUE_DOWNLOAD);
  });

  const handleStop = useMemoizedFn(() => {
    onStopDownload(item.id);
    tdApp.onEvent(STOP_DOWNLOAD);
  });

  const renderActionButtons = useMemoizedFn((item: VideoStat): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        renderTerminalBtn(item),
        renderEditIconBtn(item),
        <IconButton
          key="download"
          icon={<DownloadListIcon />}
          title={t("download")}
          onClick={handleDownloadNow}
        />,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        renderTerminalBtn(item),
        <IconButton
          key="stop"
          title={t("pause")}
          icon={<PauseCircleOutlined />}
          onClick={handleStop}
        />,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        renderTerminalBtn(item),
        renderEditIconBtn(item),
        <IconButton
          key="redownload"
          title={t("redownload")}
          icon={<DownloadListIcon />}
          onClick={handleRestart}
        />,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return [t("watting")];
    }
    if (item.status === DownloadStatus.Stopped) {
      return [
        renderTerminalBtn(item),
        renderEditIconBtn(item),
        <IconButton
          key="restart"
          icon={<DownloadListIcon />}
          title={t("continueDownload")}
          onClick={handleContinue}
        />,
      ];
    }

    // Download successfully
    return [
      <IconButton
        key={"play"}
        icon={<PlayCircleOutlined />}
        title={t("playVideo")}
        disabled={!item.exists}
        onClick={handlePlay}
      />,
    ];
  });

  const renderTitle = useMemoizedFn((item: VideoStat): ReactNode => {
    // console.log("====item", item);
    return (
      <div
        className={cn("truncate text-sm dark:text-[#B4B4B4]", {
          "text-[#127af3]": selected,
        })}
        title={item.name}
      >
        {item.folder ? item.folder + "/" : item.folder}
        {item.name}
      </div>
    );
  });

  const handleRenderTag = useMemoizedFn(() => {
    let tag = null;
    if (item.status === DownloadStatus.Downloading) {
      tag = (
        <DownloadTag
          icon={<DownloadIcon fill="#fff" width={14} height={14} />}
          text={t("downloading")}
          color="#127af3"
        />
      );
    } else if (item.status === DownloadStatus.Success) {
      tag = [
        <DownloadTag
          key={"success"}
          text={t("downloadSuccess")}
          color="#09ce87"
        />,
      ];
      if (!item.exists) {
        tag.push(
          <DownloadTag
            key={"notExists"}
            text={t("fileNotExist")}
            color="#9abbe2"
          />,
        );
      }
    } else if (item.status === DownloadStatus.Failed) {
      tag = (
        <TerminalDrawer
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
          log={item.log}
        />
      );
    } else if (item.status === DownloadStatus.Stopped) {
      tag = (
        <DownloadTag
          icon={<PauseIcon />}
          text={t("downloadPause")}
          color="#9abbe2"
        />
      );
    }
    return (
      <div className="flex flex-shrink-0 flex-grow flex-row gap-2">
        {item.isLive && (
          <DownloadTag text={t("liveResource")} color="#9abbe2" />
        )}
        {tag}
      </div>
    );
  });

  const renderDescription = useMemoizedFn((item: DownloadItem): ReactNode => {
    if (progress) {
      const { percent, speed } = progress;
      const val = Math.round(Number(percent));

      return (
        <div className="flex flex-row items-center gap-2 text-xs text-[rgba(0,0,0,0.88)] dark:text-[rgba(255,255,255,0.85)]">
          <Progress percent={val} strokeLinecap="butt" showInfo={false} />
          <div className="min-w-5 flex-shrink-0">{val}%</div>
          <div className="min-w-20 flex-shrink-0">{speed}</div>
        </div>
      );
    }
    return (
      <div
        className="relative flex flex-col gap-1 text-xs text-[#B3B3B3] dark:text-[#515257]"
        title={item.url}
      >
        <div className="truncate">{item.url}</div>
        <div className="truncate">
          {t("createdAt")} {fromatDateTime(item.createdDate)}
        </div>
        {item.status === DownloadStatus.Failed && (
          <TerminalDrawer
            asChild
            trigger={
              <div className="cursor-pointer truncate text-[#ff7373] dark:text-[rgba(255,115,115,0.6)]">
                {t("failReason")}: ... {item.log?.slice(-100)}
              </div>
            }
            title={item.name}
            id={item.id}
            log={item.log}
          />
        )}
      </div>
    );
  });

  return (
    <div
      className={cn(
        "relative flex flex-row gap-3 rounded-lg bg-[#FAFCFF] px-3 pb-3.5 pt-2 dark:bg-[#27292F]",
        {
          "bg-gradient-to-r from-[#D0E8FF] to-[#F2F7FF] dark:from-[#27292F] dark:to-[#00244E]":
            selected,
          "opacity-70": item.status === DownloadStatus.Success && !item.exists,
        },
      )}
      onContextMenu={() => onContextMenu(item.id)}
    >
      <Checkbox
        className="mt-2"
        checked={selected}
        onCheckedChange={() => onSelectChange(item.id)}
      />
      <div className={cn("flex flex-1 flex-col gap-1 overflow-hidden")}>
        {selected && (
          <img
            src={selectedBg}
            className="absolute bottom-0 right-[126px] top-0 block h-full select-none"
          />
        )}
        <div className="relative flex flex-row items-center gap-2">
          {renderTitle(item)}
          {handleRenderTag()}
          <div className="flex flex-row items-center gap-3 rounded-md bg-[#eff4fa] px-1.5 py-1.5 dark:bg-[#3B3F48]">
            {renderActionButtons(item)}
          </div>
        </div>
        {renderDescription(item)}
      </div>
    </div>
  );
}
