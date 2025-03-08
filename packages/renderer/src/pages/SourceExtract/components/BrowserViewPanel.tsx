import { Button } from "@/components/ui/button";
import useElectron from "@/hooks/useElectron";
import {
  browserStoreSelector,
  setBrowserSelector,
  SourceData,
  useBrowserStore,
} from "@/store/browser";
import React from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Button as AntdButton, App } from "antd";
import {
  DeleteOutlined,
  DockerOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import { appStoreSelector, useAppStore } from "@/store/app";

export function BrowserViewPanel() {
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { enableDocker } = useAppStore(useShallow(appStoreSelector));
  const { deleteSource, clearSources } = useBrowserStore(
    useShallow(setBrowserSelector),
  );
  const { t } = useTranslation();
  const { showDownloadDialog } = useElectron();
  const { downloadNow } = useElectron();
  const { message } = App.useApp();

  const handleClear = useMemoizedFn(() => {
    clearSources();
  });

  const handleDownloadNow = useMemoizedFn(async (item: SourceData) => {
    try {
      const downloadItem: Omit<DownloadItem, "id"> = {
        url: item.url,
        name: item.name,
        headers: item.headers,
        type: item.type,
      };
      await downloadNow(downloadItem);
    } catch (e) {
      message.error((e as any).message);
    }
  });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-white p-3 dark:bg-[#1F2024]">
      <div>
        <AntdButton size="small" danger onClick={handleClear}>
          清空
        </AntdButton>
      </div>
      {store.sources.map((item, index) => {
        return (
          <div
            className="flex flex-col gap-2 rounded-lg bg-[#FAFCFF] p-2 dark:bg-[#27292F]"
            key={index}
          >
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
                  onClick={() => deleteSource(item.url)}
                  title={t("delete")}
                  danger
                />
                <AntdButton
                  icon={<EditOutlined />}
                  type="text"
                  size="small"
                  title={t("edit")}
                  onClick={() => showDownloadDialog([item])}
                />
                {enableDocker && (
                  <AntdButton
                    icon={<DockerOutlined />}
                    type="text"
                    size="small"
                    title={t("edit")}
                    onClick={() => showDownloadDialog([item])}
                  />
                )}
              </div>
              <Button size="sm" onClick={() => handleDownloadNow(item)}>
                {t("downloadNow")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
