import React, { FC } from "react";
import { Outlet } from "react-router-dom";
import useElectron from "../hooks/electron";
import { useDispatch } from "react-redux";
import { setAppStore } from "../store";
import { useAsyncEffect } from "ahooks";
import { AppHeader } from "./AppHeader";
import { AppSideBar } from "./AppSideBar";

const App: FC = () => {
  const { getAppStore: ipcGetAppStore } = useElectron();
  const dispatch = useDispatch();

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <AppHeader className="flex-shrink-0" />
      <div className="flex h-full flex-row bg-[#F4F7FA]">
        <AppSideBar />
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
