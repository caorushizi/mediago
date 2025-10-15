import { useAsyncEffect } from "ahooks";
import { type FC, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { CHANGE_PAGE } from "@/const";
import { setAppStoreSelector, useAppStore } from "@/store/app";
import { tdApp } from "@/utils";
import { AppHeader } from "./app-header";
import { AppSideBar } from "./app-side-bar";
import useAPI from "@/hooks/use-api";

const App: FC = () => {
  const { getAppStore: ipcGetAppStore } = useAPI();
  const location = useLocation();
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    setAppStore(store);
  }, []);

  useEffect(() => {
    tdApp.onEvent(CHANGE_PAGE, { page: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <AppHeader className="shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden bg-[#F4F7FA] sm:flex-row dark:bg-[#141415]">
        <AppSideBar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default App;
