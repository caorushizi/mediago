import { ConfigProvider, theme } from "antd";
import React, { FC, Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import useElectron from "./hooks/electron";
import Loading from "./components/Loading";
import { DownloadFilter } from "./types";
import { isWeb, tdApp } from "./utils";
import { useAsyncEffect } from "ahooks";
import { ThemeContext } from "./context/ThemeContext";
import { SessionStore, useSessionStore } from "./store/session";
import { useShallow } from "zustand/react/shallow";
import { DOWNLOAD_FAIL, DOWNLOAD_SUCCESS, PAGE_LOAD } from "./const";
import { useAppStore, setAppStoreSelector } from "./store/app";
import { PageMode, setBrowserSelector, useBrowserStore } from "./store/browser";
import { downloadStoreSelector, useDownloadStore } from "./store/download";

const AppLayout = lazy(() => import("./layout/App"));
const HomePage = lazy(() => import("./pages/HomePage"));
const SourceExtract = lazy(() => import("./pages/SourceExtract"));
const SettingPage = lazy(() => import("./pages/SettingPage"));
const ConverterPage = lazy(() => import("./pages/Converter"));
const PlayerPage = lazy(() => import("./pages/Player"));

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
}

const sessionSelector = (s: SessionStore) => ({
  setUpdateAvailable: s.setUpdateAvailable,
  setUploadChecking: s.setUploadChecking,
});

const App: FC = () => {
  const [appTheme, setAppTheme] = React.useState<"dark" | "light">("light");
  const { addIpcListener, removeIpcListener, getMachineId } = useElectron();
  const { setUpdateAvailable, setUploadChecking } = useSessionStore(
    useShallow(sessionSelector),
  );
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const { increase } = useDownloadStore(useShallow(downloadStoreSelector));

  const themeChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }
  };

  // 监听store变化
  const onAppStoreChange = (event: any, store: AppStore) => {
    setAppStore(store);
  };

  const onReceiveDownloadItem = () => {
    increase();
  };

  const onChangePrivacy = () => {
    setBrowserStore({ url: "", title: "", mode: PageMode.Default });
  };

  console.log("App.tsx: onAppStoreChange", onAppStoreChange);

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
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }

    return () => {
      isDarkTheme.removeEventListener("change", themeChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={appTheme}>
      <ConfigProvider
        locale={zhCN}
        componentSize={isWeb ? undefined : "small"}
        theme={{ algorithm: getAlgorithm(appTheme) }}
      >
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
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default App;
