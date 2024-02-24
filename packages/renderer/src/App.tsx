import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import React, { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/App";
import HomePage, { DownloadFilter } from "./nodes/HomePage";
import SettingPage from "./nodes/SettingPage";
import SourceExtract from "./nodes/SourceExtract";
import { setAppStore, increase } from "./store";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import "./App.scss";
import useElectron from "./hooks/electron";

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
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="done"
              element={<HomePage filter={DownloadFilter.done} />}
            />
            <Route path="source" element={<SourceExtract />} />
            <Route path="settings" element={<SettingPage />} />
            <Route path="*" element={<div>404</div>} />
          </Route>
          <Route path="/browser" element={<SourceExtract page={true} />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
