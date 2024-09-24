import React, { FC } from "react";
import PageContainer from "../../components/PageContainer";
import { useMount, usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadFilter } from "../../types";
import { useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import { useTranslation } from "react-i18next";
import { DownloadList } from "./components";
import DownloadForm, { DownloadItemForm } from "@/components/DownloadForm";
import {
  DownloadIcon,
  DownloadBg1,
  DownloadBg2,
  FolderIcon,
  ExtractIcon,
} from "@/assets/svg";
import { Button } from "@/components/ui/button";
import { Popover, QRCode } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";

interface Props {
  filter?: DownloadFilter;
}

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
  const [localIP, setLocalIP] = React.useState<string>("");
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

  const confirmAddItems = async (values: DownloadItemForm, now?: boolean) => {
    const { batch, batchList = "", name, headers, type, url } = values;
    if (batch) {
      const items: Omit<DownloadItem, "id">[] = batchList
        .split("\n")
        .map((url: string, i: number) => {
          return {
            url: url.trim(),
            name: `${name}_${i}`,
            headers,
            type,
          };
        });
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

  const content = (
    <div>
      <QRCode value={localIP ? `http://${localIP}:3222/` : ""} />
      <div className="text-xs">{t("scanToWatch")}</div>
    </div>
  );

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
            <Popover content={content}>
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
            <DownloadForm
              destroyOnClose
              trigger={
                <div className="relative flex cursor-pointer flex-row items-center gap-5 rounded-md bg-gradient-to-r from-[#24C1FF] to-[#823CFE] px-2 py-1 text-sm text-white">
                  <img
                    className="absolute bottom-0 left-2 top-0 h-full"
                    src={DownloadBg2}
                  />
                  <img
                    className="absolute bottom-0 left-0 top-0 h-full"
                    src={DownloadBg1}
                  />
                  <DownloadIcon fill="#137BF4" />
                  {t("newDownload")}
                </div>
              }
              onAddToList={async (values) => confirmAddItems(values)}
              onDownloadNow={async (values) => confirmAddItems(values, true)}
            />
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
    </PageContainer>
  );
};

export default HomePage;
