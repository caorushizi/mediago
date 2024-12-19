import { DeleteIcon } from "@/assets/svg";
import DownloadForm, { DownloadFormRef } from "@/components/DownloadForm";
import { IconButton } from "@/components/IconButton";
import { Button } from "@/components/ui/button";
import WebView from "@/components/WebView";
import useElectron from "@/hooks/electron";
import {
  addSource,
  BrowserStatus,
  deleteSource,
  PageMode,
  selectBrowserStore,
  setBrowserStore,
} from "@/store";
import { generateUrl, randomName } from "@/utils";
import { useMemoizedFn } from "ahooks";
import { Empty, Space, Spin, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

export function BrowserView() {
  const {
    webviewLoadURL,
    addIpcListener,
    removeIpcListener,
    webviewGoHome,
    downloadNow,
    addDownloadItem,
    showDownloadDialog: ipcShowDownloadDialog,
  } = useElectron();
  const downloadForm = useRef<DownloadFormRef>(null);
  const store = useSelector(selectBrowserStore);
  const { t } = useTranslation();
  const [placeHolder, setPlaceHolder] = useState<string>("");
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const onShowDownloadDialog = async (
      e: unknown,
      data: DownloadItem[],
      image: string,
    ) => {
      if (image) {
        setPlaceHolder(image);
      }

      const item = data[0];
      downloadForm.current.openModal({
        batch: false,
        type: item.type,
        url: item.url,
        name: item.name,
        headers: item.headers,
      });
    };

    const onWebviewLinkMessage = async (e: unknown, data: any) => {
      dispatch(addSource(data));
    };

    addIpcListener("show-download-dialog", onShowDownloadDialog);
    addIpcListener("webview-link-message", onWebviewLinkMessage);

    return () => {
      removeIpcListener("show-download-dialog", onShowDownloadDialog);
      removeIpcListener("webview-link-message", onWebviewLinkMessage);
    };
  }, [store.status]);

  const onClickGoHome = async () => {
    await webviewGoHome();
    dispatch(
      setBrowserStore({
        url: "",
        title: "",
        mode: PageMode.Default,
      }),
    );
  };

  const confirmDownload = async (now?: boolean) => {
    try {
      const { name, url, headers, type, folder } =
        downloadForm.current.getFieldsValue();
      const item = {
        name: name || randomName(),
        url,
        headers,
        type,
        folder,
      };

      if (now) {
        await downloadNow(item);
      } else {
        await addDownloadItem(item);
      }

      return true;
    } catch (e) {
      messageApi.error((e as any).message);
      return false;
    }
  };

  const loadUrl = (url: string) => {
    dispatch(
      setBrowserStore({
        url,
        mode: PageMode.Browser,
        status: BrowserStatus.Loading,
      }),
    );
    webviewLoadURL(url);
  };

  const goto = () => {
    const link = generateUrl(store.url);
    loadUrl(link);
  };

  const handleFormVisibleChange = useMemoizedFn((visible: boolean) => {
    if (!visible) {
      setPlaceHolder("");
    }
  });

  const renderContent = () => {
    // Loaded state
    if (store.status === BrowserStatus.Loading) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Spin />
        </div>
      );
    }

    // Modal box
    if (placeHolder) {
      return <img src={placeHolder} className="h-full w-full" />;
    }

    // Load failure
    if (store.status === BrowserStatus.Failed) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Empty
            description={`${store.errMsg || t("loadFailed")} (${store.errCode})`}
          >
            <Space>
              <Button onClick={onClickGoHome}>{t("backToHome")}</Button>
              <Button onClick={goto}>{t("refresh")}</Button>
            </Space>
          </Empty>
        </div>
      );
    }

    // Load successfully
    if (store.status === BrowserStatus.Loaded) {
      return <WebView className="h-full w-full flex-1" />;
    }

    return null;
  };

  const renderSidePanel = () => {
    if (store.sources.length === 0) {
      return null;
    }

    return (
      <div className="flex h-full min-w-60 max-w-60 flex-col gap-3 overflow-y-auto bg-white p-3 dark:bg-[#1F2024]">
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
                <div>
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => {
                      dispatch(deleteSource(item.url));
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    ipcShowDownloadDialog([item]);
                  }}
                >
                  {t("addToDownloadList")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-full flex-1 gap-2">
        {renderContent()}
        {renderSidePanel()}
      </div>
      <DownloadForm
        id="browser"
        isEdit
        usePrevData
        ref={downloadForm}
        onDownloadNow={() => confirmDownload(true)}
        onAddToList={() => confirmDownload()}
        destroyOnClose
        onFormVisibleChange={handleFormVisibleChange}
      />
      {contextHolder}
    </div>
  );
}
