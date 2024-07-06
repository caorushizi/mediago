import React, { FC } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "antd";
import {
  EyeInvisibleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import useElectron from "../hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import { selectAppStore, setAppStore } from "../store";
import { useAsyncEffect } from "ahooks";
import { useTranslation } from "react-i18next";
import { AppHeader } from "./AppHeader";
import { AppSideBar } from "./AppSideBar";

const App: FC = () => {
  const { getAppStore: ipcGetAppStore, openUrl } = useElectron();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const appStore = useSelector(selectAppStore);

  const openHelpUrl = () => {
    const url = "https://downloader.caorushizi.cn/guides.html?form=client";
    openUrl(url);
  };

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <AppHeader />
      <div className="flex h-full flex-row">
        <AppSideBar />
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
          <div className="h-10">
            <div>
              {appStore.privacy && (
                <>
                  <EyeInvisibleOutlined /> 隐私模式
                </>
              )}
            </div>

            <Button
              type={"link"}
              onClick={openHelpUrl}
              icon={<QuestionCircleOutlined />}
            >
              {t("help")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
