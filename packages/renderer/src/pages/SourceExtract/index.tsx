import { useAsyncEffect } from "ahooks";
import React, { useEffect, useRef } from "react";
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
import { cn } from "@/utils";

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const {
    addIpcListener,
    removeIpcListener,
    getSharedState,
    getAppStore: ipcGetAppStore,
  } = useElectron();
  const dispatch = useDispatch();
  const store = useSelector(selectBrowserStore);
  const originTitle = useRef(document.title);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  useAsyncEffect(async () => {
    const state = await getSharedState();
    dispatch(setBrowserStore(state));
  }, []);

  useEffect(() => {
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("webview-fail-load", onFailLoad);
    addIpcListener("webview-did-navigate", onDidNavigate);
    addIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);

    return () => {
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("webview-fail-load", onFailLoad);
      removeIpcListener("webview-did-navigate", onDidNavigate);
      removeIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
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

  return (
    <PageContainer
      className={cn("flex flex-col p-0", { "gap-2": !page })}
      wrapperClassName={cn({ "p-0 bg-[#EBF0F5] dark:bg-[#141415]": page })}
    >
      <ToolBar page={page} />
      <div className="flex flex-1 overflow-hidden">
        {store.mode === PageMode.Browser ? <BrowserView /> : <FavoriteList />}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
