import { QrcodeOutlined } from "@ant-design/icons";
import { DownloadFilter, GET_ENV_PATH } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import { Pagination, Popover, QRCode } from "antd";
import { type FC, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { ExtractIcon, FolderIcon } from "@/assets/svg";
import DownloadForm, {
  type DownloadFormItem,
  type DownloadFormRef,
} from "@/components/download-form";
import { HomeDownloadButton } from "@/components/home-download-button";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { CLICK_DOWNLOAD } from "@/const";
import useAPI from "@/hooks/use-api";
import { useTasks } from "@/hooks/use-tasks";
import { appStoreSelector, useAppStore } from "@/store/app";
import { downloadFormSelector, useConfigStore } from "@/store/config";
import { isWeb, tdApp } from "@/utils";
import { DownloadList } from "./components/download-list";
import useSWR from "swr";
import { useUrlInvoke } from "@/hooks/use-url-invoke";

interface Props {
  filter?: DownloadFilter;
}

const HomePage: FC<Props> = ({ filter = DownloadFilter.list }) => {
  const { openDir, showBrowserWindow, getEnvPath } = useAPI();
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();
  const newFormRef = useRef<DownloadFormRef>(null);
  const homeId = useId();
  const { lastIsBatch, lastDownloadTypes } = useConfigStore(
    useShallow(downloadFormSelector),
  );

  const { pagination, total, mutate, setPage } = useTasks(filter);
  const { data: envPath } = useSWR(GET_ENV_PATH, getEnvPath);

  useUrlInvoke({
    onOpenForm: (item: DownloadFormItem) => {
      newFormRef.current?.openModal(item);
    },
    refresh: () => {
      mutate();
    },
  });

  const handleChangePage = useMemoizedFn((page: number, _: number) => {
    setPage(page);
  });

  const handleOpenForm = useMemoizedFn(() => {
    tdApp.onEvent(CLICK_DOWNLOAD);
    const item: DownloadFormItem = {
      batch: lastIsBatch,
      type: lastDownloadTypes,
    };
    newFormRef.current?.openModal(item);
  });

  const handleConfirm = useMemoizedFn(async () => {
    mutate();
  });

  return (
    <PageContainer
      title={
        filter === DownloadFilter.list
          ? t("downloadList")
          : t("downloadComplete")
      }
      rightExtra={
        <div className="flex flex-row gap-2">
          {!isWeb && (
            <Button onClick={() => openDir(appStore.local)}>
              <FolderIcon />
              {t("openFolder")}
            </Button>
          )}
          {filter === DownloadFilter.list && appStore.openInNewWindow && (
            <Button onClick={() => showBrowserWindow()}>
              <ExtractIcon fill="#fff" />
              {t("materialExtraction")}
            </Button>
          )}
          {filter === DownloadFilter.done &&
            !isWeb &&
            appStore.enableMobilePlayer && (
              <Popover
                content={
                  <div>
                    <QRCode value={envPath?.playerUrl || ""} />
                    <div className="text-xs">{t("scanToWatch")}</div>
                  </div>
                }
                placement="bottomRight"
              >
                <Button>
                  <QrcodeOutlined />
                  {t("playOnMobile")}
                </Button>
              </Popover>
            )}
          {filter === DownloadFilter.list && (
            <HomeDownloadButton onClick={handleOpenForm} />
          )}
        </div>
      }
      className="bg-white p-3 dark:bg-[#1F2024] flex flex-col flex-1 h-full rounded-lg gap-3"
    >
      <DownloadList filter={filter} />

      <Pagination
        className="flex justify-end"
        current={pagination.page}
        pageSize={pagination.pageSize}
        onChange={handleChangePage}
        total={total}
        showSizeChanger={false}
      />

      <DownloadForm
        id={homeId}
        ref={newFormRef}
        destroyOnClose
        onConfirm={handleConfirm}
      />
    </PageContainer>
  );
};

export default HomePage;
