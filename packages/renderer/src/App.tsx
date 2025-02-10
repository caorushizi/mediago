import { ConfigProvider, theme } from "antd";
import React, { FC, Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import useElectron from "@/hooks/useElectron";
import Loading from "./components/Loading";
import { DownloadFilter } from "./types";
import { isWeb, tdApp } from "./utils";
import { useAsyncEffect, useMemoizedFn } from "ahooks";
import {
  themeSelector,
  updateSelector,
  useSessionStore,
} from "./store/session";
import { useShallow } from "zustand/react/shallow";
import { DOWNLOAD_FAIL, DOWNLOAD_SUCCESS, PAGE_LOAD } from "./const";
import { useAppStore, setAppStoreSelector } from "./store/app";
import { PageMode, setBrowserSelector, useBrowserStore } from "./store/browser";
import { downloadStoreSelector, useDownloadStore } from "./store/download";
import { App as AntdApp } from "antd";

const AppLayout = lazy(() => import("./layout/App"));
const HomePage = lazy(() => import("./pages/HomePage"));
const SourceExtract = lazy(() => import("./pages/SourceExtract"));
const SettingPage = lazy(() => import("./pages/SettingPage"));
const ConverterPage = lazy(() => import("./pages/Converter"));
const PlayerPage = lazy(() => import("./pages/Player"));

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
}

const App: FC = () => {
  const { addIpcListener, removeIpcListener, getMachineId } = useElectron();
  const { setUpdateAvailable, setUploadChecking } = useSessionStore(
    useShallow(updateSelector),
  );
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const { increase } = useDownloadStore(useShallow(downloadStoreSelector));
  const { theme, setTheme } = useSessionStore(useShallow(themeSelector));

  const themeChange = useMemoizedFn((event: MediaQueryListEvent) => {
    if (event.matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  });

  // 监听store变化
  const onAppStoreChange = useMemoizedFn((event: any, store: AppStore) => {
    setAppStore(store);
  });

  const onReceiveDownloadItem = useMemoizedFn(() => {
    increase();
  });

  const onChangePrivacy = useMemoizedFn(() => {
    setBrowserStore({ url: "", title: "", mode: PageMode.Default });
  });

  useEffect(() => {
    const updateAvailable = () => {
      setUpdateAvailable(true);
      setUploadChecking(false);
    };
    const updateNotAvailable = () => {
      setUpdateAvailable(false);
      setUploadChecking(false);
    };
    const checkingForUpdate = () => {
      setUploadChecking(true);
    };
    const onDownloadSuccess = () => {
      tdApp.onEvent(DOWNLOAD_SUCCESS);
    };
    const onDownloadFailed = () => {
      tdApp.onEvent(DOWNLOAD_FAIL);
    };
    addIpcListener("store-change", onAppStoreChange);
    addIpcListener("download-item-notifier", onReceiveDownloadItem);
    addIpcListener("change-privacy", onChangePrivacy);
    addIpcListener("updateAvailable", updateAvailable);
    addIpcListener("updateNotAvailable", updateNotAvailable);
    addIpcListener("checkingForUpdate", checkingForUpdate);
    addIpcListener("download-success", onDownloadSuccess);
    addIpcListener("download-failed", onDownloadFailed);

    return () => {
      removeIpcListener("store-change", onAppStoreChange);
      removeIpcListener("download-item-notifier", onReceiveDownloadItem);
      removeIpcListener("change-privacy", onChangePrivacy);
      removeIpcListener("updateAvailable", updateAvailable);
      removeIpcListener("updateNotAvailable", updateNotAvailable);
      removeIpcListener("checkingForUpdate", checkingForUpdate);
      removeIpcListener("download-success", onDownloadSuccess);
      removeIpcListener("download-failed", onDownloadFailed);
    };
  }, []);

  useAsyncEffect(async () => {
    const deviceId = await getMachineId();
    tdApp.onEvent(PAGE_LOAD, { deviceId });
  }, []);

  useEffect(() => {
    const isDarkTheme = matchMedia("(prefers-color-scheme: dark)");
    isDarkTheme.addEventListener("change", themeChange);

    if (isDarkTheme.matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    return () => {
      isDarkTheme.removeEventListener("change", themeChange);
    };
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      componentSize={isWeb ? undefined : "small"}
      theme={{ algorithm: getAlgorithm(theme) }}
    >
      <AntdApp className="size-full overflow-hidden">
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<Loading />}>
                  <AppLayout />
                </Suspense>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<Loading />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path="done"
                element={
                  <Suspense fallback={<Loading />}>
                    <HomePage filter={DownloadFilter.done} />
                  </Suspense>
                }
              />
              <Route
                path="source"
                element={
                  <Suspense fallback={<Loading />}>
                    <SourceExtract />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<Loading />}>
                    <SettingPage />
                  </Suspense>
                }
              />
              <Route
                path="converter"
                element={
                  <Suspense fallback={<Loading />}>
                    <ConverterPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<div>404</div>} />
            </Route>
            <Route
              path="/browser"
              element={
                <Suspense fallback={<Loading />}>
                  <SourceExtract page={true} />
                </Suspense>
              }
            />
            <Route
              path="player"
              element={
                <Suspense fallback={<Loading />}>
                  <PlayerPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
