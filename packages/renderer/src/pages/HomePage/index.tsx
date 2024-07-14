import React, { FC } from "react";
import { Button } from "antd";
import PageContainer from "../../components/PageContainer";
import { usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadFilter } from "../../types";
import { useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import { useTranslation } from "react-i18next";
import { DownloadList } from "./components";
import DownloadForm, { DownloadItemForm } from "@/components/DownloadForm";
import DownloadIcon from "./components/svg/download.svg?react";
import DownloadBg1 from "./components/svg/download-bg1.svg?react";
import DownloadBg2 from "./components/svg/download-bg2.svg?react";

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
  } = useElectron();
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();
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
            <Button type="primary" onClick={() => showBrowserWindow()}>
              {t("openBrowser")}
            </Button>
          )}
          <Button onClick={() => openDir(appStore.local)}>
            {t("openFolder")}
          </Button>
          {filter === DownloadFilter.list && (
            <DownloadForm
              destroyOnClose
              trigger={
                <div className="relative flex cursor-pointer flex-row items-center gap-5 rounded-md bg-gradient-to-r from-[#24C1FF] to-[#823CFE] px-2 py-1 text-xs text-white">
                  {/* <DownloadBg1 /> */}
                  {/* <DownloadBg2 /> */}
                  <DownloadIcon />
                  {t("newDownload")}
                </div>
              }
              onAddToList={async (values) => confirmAddItems(values)}
              onDownloadNow={async (values) => confirmAddItems(values, true)}
            />
          )}
        </div>
      }
      className="rounded-lg bg-white p-3"
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
