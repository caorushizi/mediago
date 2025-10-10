import { QrcodeOutlined } from "@ant-design/icons";
import { useMemoizedFn, useMount, usePagination } from "ahooks";
import { Popover, QRCode } from "antd";
import { type FC, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { ExtractIcon, FolderIcon } from "@/assets/svg";
import DownloadForm, { type DownloadFormRef, type DownloadFormItem } from "@/components/download-form";
import { HomeDownloadButton } from "@/components/home-download-button";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { CLICK_DOWNLOAD } from "@/const";
import { appStoreSelector, useAppStore } from "@/store/app";
import { downloadFormSelector, useConfigStore } from "@/store/config";
import { DownloadFilter } from "@/types";
import { isDownloadType, isWeb, randomName, tdApp, urlDownloadType } from "@/utils";
import { DownloadList } from "./components";
import useAPI from "@/hooks/use-api";

interface Props {
  filter?: DownloadFilter;
}

const HomePage: FC<Props> = ({ filter = DownloadFilter.list }) => {
  const {
    getDownloadItems,
    openDir,
    showBrowserWindow,
    addDownloadItems,
    getLocalIP,
    addIpcListener,
    removeIpcListener,
  } = useAPI();
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { t } = useTranslation();
  const [localIP, setLocalIP] = useState<string>("");
  const newFormRef = useRef<DownloadFormRef>(null);
  const homeId = useId();
  const { lastIsBatch, lastDownloadTypes } = useConfigStore(useShallow(downloadFormSelector));
  const location = useLocation();
  const {
    data = { total: 0, list: [] },
    loading,
    pagination,
    refresh,
  } = usePagination(
    ({ current, pageSize }) => {
      return getDownloadItems({
        current,
        pageSize,
        filter,
      });
    },
    {
      defaultPageSize: 50,
      refreshDeps: [filter],
    },
  );

  useEffect(() => {
    addIpcListener("refresh-list", refresh);
    return () => {
      removeIpcListener("refresh-list", refresh);
    };
  }, []);

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
    refresh();
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
      className="rounded-lg bg-white p-3 dark:bg-[#1F2024]"
    >
      <DownloadList loading={loading} data={data.list} filter={filter} refresh={refresh} pagination={pagination} />

      <DownloadForm id={homeId} ref={newFormRef} destroyOnClose onConfirm={handleConfirm} />
    </PageContainer>
  );
};

export default HomePage;
