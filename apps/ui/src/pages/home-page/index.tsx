import { QrcodeOutlined } from "@ant-design/icons";
import { DOWNLOAD_EVENT_NAME, type DownloadSuccessEvent } from "@mediago/shared-common";
import { useMemoizedFn, useMount } from "ahooks";
import { Pagination, Popover, QRCode } from "antd";
import { produce } from "immer";
import { type FC, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { ExtractIcon, FolderIcon } from "@/assets/svg";
import DownloadForm, { type DownloadFormItem, type DownloadFormRef } from "@/components/download-form";
import { HomeDownloadButton } from "@/components/home-download-button";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { CLICK_DOWNLOAD } from "@/const";
import useAPI from "@/hooks/use-api";
import { useTasks } from "@/hooks/use-tasks";
import { appStoreSelector, useAppStore } from "@/store/app";
import { downloadFormSelector, useConfigStore } from "@/store/config";
import { DownloadFilter } from "@/types";
import { isDownloadType, isWeb, randomName, tdApp, urlDownloadType } from "@/utils";
import { DownloadList } from "./components/download-list";

interface Props {
  filter?: DownloadFilter;
}

const HomePage: FC<Props> = ({ filter = DownloadFilter.list }) => {
  const { openDir, showBrowserWindow, addDownloadItems, getLocalIP, addIpcListener, removeIpcListener } = useAPI();
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();
  const [localIP, setLocalIP] = useState<string>("");
  const newFormRef = useRef<DownloadFormRef>(null);
  const homeId = useId();
  const { lastIsBatch, lastDownloadTypes } = useConfigStore(useShallow(downloadFormSelector));
  const location = useLocation();
  const { data, isLoading, pagination, mutate } = useTasks(filter);

  useEffect(() => {
    const search = new URLSearchParams(location.search);

    // new
    if (search.has("n")) {
      const typeParam = search.get("type");
      const silent = !!search.get("silent");
      const urlDecode = decodeURIComponent(search.get("encodedURL") || "");
      const url = urlDecode || search.get("url") || "";
      const name = search.get("name") + randomName() || randomName();
      const type = isDownloadType(typeParam) ? typeParam : urlDownloadType(url);
      const headers = decodeURIComponent(search.get("headers") || "");

      if (silent) {
        const item: Omit<DownloadItem, "id"> = {
          type,
          url,
          name,
          headers,
          folder: "",
        };
        addDownloadItems([item], true);
      } else {
        const item: DownloadFormItem = {
          batch: false,
          type,
          url,
          name,
          headers,
        };
        newFormRef.current?.openModal(item);
      }
    }
  }, [location.search]);

  // mac ipc event get url params in macos schceme
  useEffect(() => {
    const handleUrlEvent = (event: unknown, url: string) => {
      const searchParams = new URLSearchParams(url.split("?")[1]);
      if (searchParams.get("n") === "true") {
        const name = searchParams.get("name") || randomName();
        const urlParam = searchParams.get("url") || "";
        const item: DownloadFormItem = {
          batch: false,
          type: urlDownloadType(urlParam),
          url: urlParam,
          name,
          headers: "",
        };
        newFormRef.current?.openModal(item);
      }
    };

    addIpcListener("url-params", handleUrlEvent);
    return () => {
      removeIpcListener("url-params", handleUrlEvent);
    };
  }, []);

  useEffect(() => {
    const handleSuccess = (_: unknown, { data: successData }: DownloadSuccessEvent) => {
      const after = produce(data, (draft) => {
        if (!draft) return;

        const index = draft?.list.findIndex((item) => item.id === successData.id);
        if (index != null && index > -1) {
          draft?.list.splice(index, 1);
          draft.total = draft.total - 1;
        }
      });
      mutate(after);
    };

    addIpcListener(DOWNLOAD_EVENT_NAME, handleSuccess);
    return () => {
      removeIpcListener(DOWNLOAD_EVENT_NAME, handleSuccess);
    };
  }, [data, addIpcListener, removeIpcListener]);

  useMount(async () => {
    const ip = await getLocalIP();
    setLocalIP(ip);
  });

  const handleOpenForm = useMemoizedFn(() => {
    tdApp.onEvent(CLICK_DOWNLOAD);
    const item: DownloadFormItem = {
      batch: lastIsBatch,
      type: lastDownloadTypes,
    };
    newFormRef.current?.openModal(item);
  });

  const handleConfirm = useMemoizedFn(async (values: DownloadFormItem) => {
    // refresh();
  });

  return (
    <PageContainer
      title={filter === DownloadFilter.list ? t("downloadList") : t("downloadComplete")}
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
          {filter === DownloadFilter.done && !isWeb && (
            <Popover
              content={
                <div>
                  <QRCode value={localIP ? `http://${localIP}:3222/` : ""} />
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
          {filter === DownloadFilter.list && <HomeDownloadButton onClick={handleOpenForm} />}
        </div>
      }
      className="bg-white p-3 dark:bg-[#1F2024] flex flex-col flex-1 h-full rounded-lg gap-3"
    >
      <DownloadList loading={isLoading} data={data?.list || []} filter={filter} refresh={() => {}} />

      <Pagination
        className="flex justify-end"
        current={pagination.page}
        pageSize={pagination.pageSize}
        total={data?.total}
        showSizeChanger={false}
      />

      <DownloadForm id={homeId} ref={newFormRef} destroyOnClose onConfirm={handleConfirm} />
    </PageContainer>
  );
};

export default HomePage;
