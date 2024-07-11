import { useAsyncEffect, useRequest } from "ahooks";
import { message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import {
  BrowserStatus,
  PageMode,
  selectBrowserStore,
  setAppStore,
  setBrowserStore,
} from "../../store";
import { FavoriteList } from "./components/FavoriteList";
import { BrowserView } from "./components/BrowserView";
import { ToolBar } from "./components/ToolBar";
import DownloadForm, { DownloadFormRef } from "@/components/DownloadForm";

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const {
    getFavorites,
    removeFavorite,
    webviewLoadURL,
    addIpcListener,
    removeIpcListener,
    getSharedState,
    getAppStore: ipcGetAppStore,
    downloadNow,
    addDownloadItem,
  } = useElectron();
  const dispatch = useDispatch();
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const store = useSelector(selectBrowserStore);
  const [modalShow, setModalShow] = useState(false);
  const downloadForm = useRef<DownloadFormRef>(null);
  const originTitle = useRef(document.title);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

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

  const onClickLoadItem = (item: Favorite) => {
    loadUrl(item.url);
  };

  const onFavoriteEvent = async (
    e: unknown,
    {
      action,
      payload,
    }: {
      action: string;
      payload: number;
    },
  ) => {
    if (action === "open") {
      const item = favoriteList.find((item) => item.id === payload);
      if (item) {
        onClickLoadItem(item);
      }
    } else if (action === "delete") {
      await removeFavorite(payload);
      refresh();
    }
  };

  useAsyncEffect(async () => {
    const state = await getSharedState();
    dispatch(setBrowserStore(state));
  }, []);

  // 设置当前的下载表单
  const setCurrentDownloadForm = async (data: DownloadItem) => {
    const { type, url, name, headers } = data;

    downloadForm.current.setFieldsValue({
      type,
      url,
      name,
      headers,
    });
  };

  useEffect(() => {
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("webview-fail-load", onFailLoad);
    addIpcListener("webview-did-navigate", onDidNavigate);
    addIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
    addIpcListener("favorite-item-event", onFavoriteEvent);

    return () => {
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("webview-fail-load", onFailLoad);
      removeIpcListener("webview-did-navigate", onDidNavigate);
      removeIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
      removeIpcListener("favorite-item-event", onFavoriteEvent);
    };
  }, [store.status]);

  const setPageInfo = ({ url, title }: UrlDetail) => {
    document.title = title;
    dispatch(setBrowserStore({ url, title }));
  };

  const onDomReady = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  };

  const onFailLoad = (e: unknown, data: { code: number; desc: string }) => {
    dispatch(
      setBrowserStore({
        status: BrowserStatus.Failed,
        errCode: data.code,
        errMsg: data.desc,
      }),
    );
  };

  const onDidNavigate = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
    dispatch(setBrowserStore({ status: BrowserStatus.Loaded }));
  };

  const onDidNavigateInPage = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  };

  useEffect(() => {
    document.title = store.title || document.title;
    return () => {
      document.title = originTitle.current;
    };
  }, []);

  const confirmDownload = async (now?: boolean) => {
    try {
      const data = downloadForm.current.getFieldsValue();

      if (now) {
        await downloadNow(data);
      } else {
        await addDownloadItem(data);
      }

      // 提交成功后关闭弹窗
      setModalShow(false);

      return true;
    } catch (e) {
      message.error((e as any).message);
      return false;
    }
  };

  // 渲染表单
  const renderModalForm = () => {
    return (
      <DownloadForm
        isEdit
        ref={downloadForm}
        open={modalShow}
        onOpenChange={setModalShow}
        onDownloadNow={() => confirmDownload(true)}
        onAddToList={() => confirmDownload()}
      />
    );
  };

  const onDownloadForm = (data: DownloadItem) => {
    setCurrentDownloadForm(data);
  };

  return (
    <PageContainer className="flex flex-col p-0">
      <ToolBar page={page} />
      <div className="flex flex-1 bg-blue-900">
        {store.mode === PageMode.Browser ? (
          <BrowserView onDownloadForm={onDownloadForm} />
        ) : (
          <FavoriteList />
        )}
      </div>
      {renderModalForm()}
    </PageContainer>
  );
};

export default SourceExtract;
