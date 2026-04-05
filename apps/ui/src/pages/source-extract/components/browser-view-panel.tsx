import {
  DeleteOutlined,
  DockerOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import { Button as AntdButton, App } from "antd";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { appStoreSelector, useAppStore } from "@/store/app";
import {
  browserSourcesSelector,
  type SourceData,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import { usePlatform } from "@/hooks/use-platform";
import { createDownloadTasks } from "@/api/download-task";
import { DownloadTask } from "@mediago/shared-common";

interface SourceItemProps {
  item: SourceData;
  enableDocker: boolean;
  onDelete: (url: string) => void;
  onEdit: (items: SourceData[]) => void;
  onDownload: (item: SourceData) => void;
}

const SourceItem = memo(function SourceItem({
  item,
  enableDocker,
  onDelete,
  onEdit,
  onDownload,
}: SourceItemProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-[#FAFCFF] p-2 dark:bg-[#27292F]">
      <span
        className="line-clamp-2 cursor-default break-words text-sm text-[#343434] dark:text-[#B4B4B4]"
        title={item.name}
      >
        {item.name}
      </span>
      <span
        className="line-clamp-2 cursor-default break-words text-xs dark:text-[#515257]"
        title={item.url}
      >
        {item.url}
      </span>
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex flex-row items-center gap-2">
          <AntdButton
            icon={<DeleteOutlined />}
            type="text"
            size="small"
            onClick={() => onDelete(item.url)}
            title={t("delete")}
            danger
          />
          <AntdButton
            icon={<EditOutlined />}
            type="text"
            size="small"
            title={t("edit")}
            onClick={() => onEdit([item])}
          />
          {enableDocker && (
            <AntdButton
              icon={<DockerOutlined />}
              type="text"
              size="small"
              title={t("edit")}
              onClick={() => onEdit([item])}
            />
          )}
        </div>
        <Button size="sm" onClick={() => onDownload(item)}>
          {t("downloadNow")}
        </Button>
      </div>
    </div>
  );
});

export function BrowserViewPanel() {
  const { sources } = useBrowserStore(useShallow(browserSourcesSelector));
  const { enableDocker } = useAppStore(useShallow(appStoreSelector));
  const { deleteSource, clearSources } = useBrowserStore(
    useShallow(setBrowserSelector),
  );
  const { t } = useTranslation();
  const { browser } = usePlatform();
  const { message } = App.useApp();

  const handleClear = useMemoizedFn(() => {
    clearSources();
  });

  const handleEdit = useMemoizedFn((items: SourceData[]) => {
    browser.showDownloadDialog(items);
  });

  const handleDownloadNow = useMemoizedFn(async (item: SourceData) => {
    try {
      const downloadTask: Omit<DownloadTask, "id"> = {
        url: item.url,
        name: item.name,
        headers: item.headers,
        type: item.type,
        folder: "",
      };
      await createDownloadTasks([downloadTask], true);
    } catch (e) {
      message.error((e as Error).message);
    }
  });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-white p-3 dark:bg-[#1F2024]">
      <div>
        <AntdButton size="small" danger onClick={handleClear}>
          {t("clear")}
        </AntdButton>
      </div>
      {sources.map((item) => (
        <SourceItem
          key={item.id}
          item={item}
          enableDocker={enableDocker}
          onDelete={deleteSource}
          onEdit={handleEdit}
          onDownload={handleDownloadNow}
        />
      ))}
    </div>
  );
}
