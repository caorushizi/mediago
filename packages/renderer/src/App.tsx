import { ConfigProvider, theme } from "antd";
import React, { FC, Suspense, lazy, useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { setAppStore, increase } from "./store";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import "./App.scss";
import useElectron from "./hooks/electron";
import Loading from "./components/Loading";
import { DownloadFilter } from "./types";

const AppLayout = lazy(() => import("./layout/App"));
const HomePage = lazy(() => import("./pages/HomePage"));
const SourceExtract = lazy(() => import("./pages/SourceExtract"));
const SettingPage = lazy(() => import("./pages/SettingPage"));
const ConverterPage = lazy(() => import("./pages/Converter"));

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
}

const App: FC = () => {
  const dispatch = useDispatch();
  const [appTheme, setAppTheme] = React.useState<"dark" | "light">("light");
  const { addIpcListener, removeIpcListener } = useElectron();

  const themeChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }
  };

  // 监听store变化
  const onAppStoreChange = (event: any, store: AppStore) => {
    dispatch(setAppStore(store));
  };

  const onReceiveDownloadItem = () => {
    dispatch(increase());
  };

  useEffect(() => {
    addIpcListener("store-change", onAppStoreChange);
    addIpcListener("download-item-notifier", onReceiveDownloadItem);

    return () => {
      removeIpcListener("store-change", onAppStoreChange);
      removeIpcListener("download-item-notifier", onReceiveDownloadItem);
    };
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
    <ConfigProvider
      locale={zhCN}
      componentSize="small"
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
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
