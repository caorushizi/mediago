import { cn } from "@/utils";
import React, { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DownloadStatus } from "@/types";
import { Button, Progress, Space } from "antd";
import {
  CodeOutlined,
  DownloadOutlined,
  EditOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectAppStore } from "@/store";
import selectedBg from "./images/select-item-bg.png";
import { CurrTerminal } from "./types";
import DownloadForm from "@/components/DownloadForm";

interface Props {
  item: DownloadItem;
  onSelectChange: (id: number) => void;
  selected: boolean;
  onShowTerminal: (item: DownloadItem) => void;
  currTerminal: CurrTerminal;
  onStartDownload: (id: number) => void;
  onStopDownload: (item: number) => void;
  onConfirmEdit: (
    values: DownloadItem,
    downloadNow?: boolean,
  ) => Promise<boolean>;
  onContextMenu: (item: number) => void;
  progress?: DownloadProgress;
}

export function DownloadItem({
  item,
  onSelectChange,
  selected,
  onShowTerminal,
  currTerminal,
  onStartDownload,
  onStopDownload,
  onConfirmEdit,
  onContextMenu,
  progress,
}: Props) {
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();

  const renderTerminalBtn = (item: DownloadItem) => {
    if (!appStore.showTerminal) return null;

    return (
      <Button
        key="terminal"
        type={currTerminal.id === item.id ? "primary" : "text"}
        title={t("terminal")}
        icon={<CodeOutlined />}
        onClick={() => {
          if (currTerminal.id !== item.id) {
            onShowTerminal(item);
          }
        }}
      />
    );
  };
  // 编辑表单
  const renderEditForm = (item: DownloadItem) => {
    return (
      <DownloadForm
        key={"edit"}
        isEdit
        item={item}
        trigger={
          <Button type="text" title={t("edit")} icon={<EditOutlined />} />
        }
        onAddToList={(values) => onConfirmEdit(values)}
        onDownloadNow={(values) => onConfirmEdit(values, true)}
      />
    );
  };
  const renderActionButtons = (item: DownloadItem): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="download"
          icon={<DownloadOutlined />}
          title={t("download")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        renderTerminalBtn(item),
        <Button
          type="text"
          key="stop"
          title={t("pause")}
          icon={<PauseCircleOutlined />}
          onClick={() => onStopDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="redownload"
          title={t("redownload")}
          icon={<DownloadOutlined />}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return [t("watting")];
    }
    if (item.status === DownloadStatus.Stopped) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="restart"
          icon={<DownloadOutlined />}
          title={t("continueDownload")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }

    // 下载成功
    return [];
  };

  const renderTitle = (item: DownloadItem): ReactNode => {
    let tag = null;
    if (item.status === DownloadStatus.Downloading) {
      tag = <div>{t("downloading")}</div>;
    } else if (item.status === DownloadStatus.Success) {
      tag = <div>{t("downloadSuccess")}</div>;
    } else if (item.status === DownloadStatus.Failed) {
      tag = <div>{t("downloadFailed")}</div>;
    } else if (item.status === DownloadStatus.Stopped) {
      tag = <div>{t("downloadPause")}</div>;
    }

    return (
      <div className="flex flex-row gap-2">
        <div
          className={cn({
            "text-[#127AF3]": selected,
          })}
        >
          {item.name}
        </div>
        {item.isLive && <div>{t("liveResource")}</div>}
        {tag}
      </div>
    );
  };

  const renderDescription = (item: DownloadItem): ReactNode => {
    if (progress) {
      const { percent, speed } = progress;

      return (
        <Space.Compact className="download-progress description" block>
          <Progress
            percent={Math.round(Number(percent))}
            strokeLinecap="butt"
          />
          <div className="progress-speed">{speed}</div>
        </Space.Compact>
      );
    }
    return (
      <div className="relative truncate text-[#B3B3B3]" title={item.url}>
        {item.url}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-row gap-3 rounded-lg bg-[#FAFCFF] px-3 py-3.5",
        {
          "bg-gradient-to-r from-[#D0E8FF] to-[#F2F7FF]": selected,
        },
      )}
      onContextMenu={() => onContextMenu(item.id)}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelectChange(item.id)}
      />
      <div className={cn("flex flex-1 flex-col gap-3 overflow-hidden")}>
        {selected && (
          <img
            src={selectedBg}
            className="absolute bottom-0 right-[126px] top-0 block h-full select-none"
          />
        )}
        <div className="relative flex flex-row items-center justify-between">
          {renderTitle(item)}
          <div className="flex flex-row gap-7 bg-white">
            {renderActionButtons(item)}
          </div>
        </div>
        {renderDescription(item)}
      </div>
    </div>
  );
}
