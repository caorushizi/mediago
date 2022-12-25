import React, { FC, useEffect, useRef, useState } from "react";
import "./index.scss";
import { message } from "antd";
import { VideoStatus, VideoType } from "../../types";
import audioSrc from "../../assets/tip.mp3";
import { onEvent } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { Settings, updateSettings } from "../../store/actions/settings.actions";
import { AppState } from "../../store/reducers";
import useElectron from "../../hooks/electron";
import NewDownloadList from "../../nodes/main/elements/DownloadList";
import { updateNotifyCount } from "../../store/actions/main.actions";
import { IpcRendererEvent } from "electron";

const audio = new Audio(audioSrc);

enum TabKey {
  HomeTab = "1",
  SettingTab = "3",
}

const MainPage: FC = () => {
  const [tableData, setTableData] = useState<SourceItem[]>([]);
  const [activeKey, setActiveKey] = useState<TabKey>(TabKey.HomeTab);
  const dispatch = useDispatch();
  const settings = useSelector<AppState, Settings>((state) => state.settings);
  const countRef = useRef(0);

  const { workspace, exeFile } = settings;
  const { addEventListener, removeEventListener, store } = useElectron();

  useEffect(() => {
    initData();

    addEventListener("m3u8-notifier", handleWebViewMessage);
    return () => {
      removeEventListener("m3u8-notifier", handleWebViewMessage);
    };
  }, []);

  const initData = async () => {
    // 开始初始化表格数据
    const tableData = await window.electron.getVideoList();
    console.log("tableData: ", tableData);
    const initialSettings = await store.get();
    dispatch(updateSettings(initialSettings));
    setTableData(tableData);
    setActiveKey(
      initialSettings.workspace ? TabKey.HomeTab : TabKey.SettingTab
    );
  };

  const handleWebViewMessage = async (
    e: IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const item: SourceItem = {
      ...source,
      exeFile,
      status: VideoStatus.Ready,
      type: VideoType.M3u8,
      directory: settings.workspace,
      createdAt: Date.now(),
      deleteSegments: true,
    };
    const sourceItem = await window.electron.addVideo(item);
    if (!sourceItem) return;
    const tableData = await window.electron.getVideoList();

    setTableData(tableData);

    dispatch(updateNotifyCount(countRef.current + 1));
  };

  // 首页面板切换事件
  const onTabChange = (activeKey: TabKey): void => {
    if (activeKey === TabKey.HomeTab) {
      dispatch(updateNotifyCount(0));
    }
  };

  // 首页面板点击事件
  const onTabClick = async (activeKey: TabKey): Promise<void> => {
    if (!settings.workspace) {
      message.error("请选择本地路径");
      return;
    }
    if (activeKey === TabKey.SettingTab) {
      onEvent.toSettingPage();
    } else if (activeKey === TabKey.HomeTab) {
      onEvent.toMainPage();
    }
    setActiveKey(activeKey);
  };

  // 切换视频源的 status
  const changeVideoStatus = async (
    source: SourceItem,
    status: VideoStatus
  ): Promise<void> => {
    if (status === VideoStatus.Success && settings.tip) {
      await audio.play();
    }
    await window.electron.updateVideo(source.id, { status });
    const tableData = await window.electron.getVideoList();
    console.log(tableData);
    setTableData(tableData);
  };

  // 更新表格的数据
  const updateTableData = async (): Promise<void> => {
    const videos = await window.electron.getVideoList();

    setTableData(videos);
  };

  return (
    <div className="main-window">
      <div className="main-window">
        <NewDownloadList
          workspace={workspace}
          tableData={tableData}
          changeVideoStatus={changeVideoStatus}
          updateTableData={updateTableData}
        />
      </div>
    </div>
  );
};

export default MainPage;
