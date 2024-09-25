import React, { FC, useRef, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { useMemoizedFn, useMount, usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadFilter } from "../../types";
import { useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import { useTranslation } from "react-i18next";
import { DownloadList } from "./components";
import DownloadForm, {
  DownloadFormRef,
  DownloadFormType,
} from "@/components/DownloadForm";
import { FolderIcon, ExtractIcon } from "@/assets/svg";
import { Button } from "@/components/ui/button";
import { Popover, QRCode } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { HomeDownloadButton } from "@/components/HomeDownloadButton";
import { ConfigStore, useConfigStore } from "@/store/config";
import { useShallow } from "zustand/react/shallow";
import { randomName } from "@/utils";

interface Props {
  filter?: DownloadFilter;
}

const configSelector = (s: ConfigStore) => ({
  lastIsBatch: s.lastIsBatch,
  lastDownloadTypes: s.lastDownloadTypes,
});

const HomePage: FC<Props> = ({ filter = DownloadFilter.list }) => {
  const {
    getDownloadItems,
    openDir,
    showBrowserWindow,
    addDownloadItem,
    addDownloadItems,
    downloadItemsNow,
    downloadNow,
    getLocalIP,
  } = useElectron();
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();
  const [localIP, setLocalIP] = useState<string>("");
  const newFormRef = useRef<DownloadFormRef>(null);
  const { lastIsBatch, lastDownloadTypes } = useConfigStore(
    useShallow(configSelector),
  );
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

  useMount(async () => {
    const ip = await getLocalIP();
    setLocalIP(ip);
  });

  const confirmAddItems = async (values: DownloadFormType, now?: boolean) => {
    const { batch, batchList = "", name, headers, type, url } = values;
    if (batch) {
      /**
       * 这里需要解析 batchList
       * batchList 格式
       * url1 name1\n
       * url2 name2\n
       * url3
       * ...
       */
      const items: Omit<DownloadItem, "id">[] = batchList
        .split("\n")
        .map((line: string) => {
          const [url, name] = line.trim().split(" ");
          return {
            url: url.trim(),
            name: name || randomName(),
            headers,
            type,
          };
        });
      console.log("items", items);
      if (now) {
        await downloadItemsNow(items);
      } else {
        await addDownloadItems(items);
      }
    } else {
      const item: Omit<DownloadItem, "id"> = {
        name,
        url,
        headers,
        type,
      };
      if (now) {
        await downloadNow(item);
      } else {
        await addDownloadItem(item);
      }
    }

    refresh();
    return true;
  };

  const handleOpenForm = useMemoizedFn(() => {
    const item: DownloadFormType = {
      batch: lastIsBatch,
      type: lastDownloadTypes,
    };
    newFormRef.current?.openModal(item);
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
          {filter === DownloadFilter.list && appStore.openInNewWindow && (
            <Button onClick={() => showBrowserWindow()}>
              <ExtractIcon fill="#fff" />
              {t("materialExtraction")}
            </Button>
          )}
          {filter === DownloadFilter.done && (
            <Popover
              content={
                <div>
                  <QRCode value={localIP ? `http://${localIP}:3222/` : ""} />
                  <div className="text-xs">{t("scanToWatch")}</div>
                </div>
              }
            >
              <Button>
                <QrcodeOutlined />
                {t("playOnMobile")}
              </Button>
            </Popover>
          )}
          <Button onClick={() => openDir(appStore.local)}>
            <FolderIcon />
            {t("openFolder")}
          </Button>
          {filter === DownloadFilter.list && (
            <HomeDownloadButton onClick={handleOpenForm} />
          )}
        </div>
      }
      className="rounded-lg bg-white p-3 dark:bg-[#1F2024]"
    >
      <DownloadList
        loading={loading}
        data={data.list}
        filter={filter}
        refresh={refresh}
        pagination={pagination}
      />

      <DownloadForm
        ref={newFormRef}
        destroyOnClose
        onAddToList={(values) => confirmAddItems(values)}
        onDownloadNow={(values) => confirmAddItems(values, true)}
      />
    </PageContainer>
  );
};

export default HomePage;
