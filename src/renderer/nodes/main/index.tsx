import React, { FC, useEffect, useRef, useState } from "react";
import "./index.scss";
import { Badge, Button, Drawer, message, Tabs } from "antd";
import WindowToolBar from "renderer/components/WindowToolBar";
import Setting from "renderer/nodes/main/elements/Setting";
import Comment from "renderer/components/Comment";
import { SourceStatus, SourceType } from "renderer/types";
import {
  getVideos,
  insertVideo,
  updateVideoStatus,
} from "renderer/utils/localforge";
import audioSrc from "../../assets/tip.mp3";
import onEvent from "renderer/utils/td-utils";
import { useDispatch, useSelector } from "react-redux";
import {
  Settings,
  updateSettings,
} from "renderer/store/actions/settings.actions";
import { AppState } from "renderer/store/reducers";
import useElectron from "renderer/hooks/electron";
import NewDownloadList from "renderer/nodes/main/elements/DownloadList";
import {
  MainState,
  updateNotifyCount,
} from "renderer/store/actions/main.actions";

const audio = new Audio(audioSrc);

enum TabKey {
  HomeTab = "1",
  SettingTab = "3",
}

const { TabPane } = Tabs;

const MainPage: FC = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [tableData, setTableData] = useState<SourceItem[]>([]);
  const [activeKey, setActiveKey] = useState<TabKey>(TabKey.HomeTab);
  const dispatch = useDispatch();
  const settings = useSelector<AppState, Settings>((state) => state.settings);
  const countRef = useRef(0);
  const { notifyCount } = useSelector<AppState, MainState>(
    (state) => state.main
  );
  countRef.current = notifyCount;
  const { workspace } = settings;
  const {
    addEventListener,
    removeEventListener,
    closeMainWindow,
  } = useElectron();

  useEffect(() => {
    initData();

    addEventListener("m3u8", handleWebViewMessage);
    return () => {
      removeEventListener("m3u8", handleWebViewMessage);
    };
  }, []);

  const initData = async () => {
    // 开始初始化表格数据
    const tableData = await getVideos();
    const initialSettings = await window.electron.store.get();
    dispatch(updateSettings(initialSettings));
    setTableData(tableData);
    setActiveKey(
      initialSettings.workspace ? TabKey.HomeTab : TabKey.SettingTab
    );
  };

  const handleWebViewMessage = async (
    e: Electron.IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const item: SourceItem = {
      ...source,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: settings.workspace,
      createdAt: Date.now(),
      deleteSegments: true,
    };
    const sourceItem = await insertVideo(item);
    if (!sourceItem) return;
    const tableData = await getVideos();

    setTableData(tableData);

    dispatch(updateNotifyCount(countRef.current + 1));
  };

  const handleDrawerClose = (): void => {
    setIsDrawerVisible(false);
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
  const changeSourceStatus = async (
    source: SourceItem,
    status: SourceStatus
  ): Promise<void> => {
    if (status === SourceStatus.Success && settings.tip) {
      await audio.play();
    }
    await updateVideoStatus(source, status);
    const tableData = await getVideos();

    setTableData(tableData);
  };

  // 更新表格的数据
  const updateTableData = async (): Promise<void> => {
    const videos = await getVideos();

    setTableData(videos);
  };

  return (
    <div className="main-window">
      <WindowToolBar
        color="#4090F7"
        onClose={() => {
          closeMainWindow();
        }}
      />
      <div className="main-window">
        <Tabs
          activeKey={activeKey}
          tabPosition="top"
          className="main-window-tabs"
          onChange={(value) => onTabChange(value as TabKey)}
          onTabClick={(key) => onTabClick(key as TabKey)}
        >
          <TabPane
            tab={
              <Badge className="download-item" count={notifyCount}>
                下载
              </Badge>
            }
            key={TabKey.HomeTab}
          >
            <NewDownloadList
              workspace={workspace}
              tableData={tableData}
              changeSourceStatus={changeSourceStatus}
              updateTableData={updateTableData}
            />
          </TabPane>
          <TabPane tab="设置" key={TabKey.SettingTab}>
            <Setting />
          </TabPane>
        </Tabs>
      </div>

      <Drawer
        title="评论反馈"
        placement="right"
        closable={false}
        width={500}
        onClose={handleDrawerClose}
        visible={isDrawerVisible}
        className="comment-drawer"
      >
        <Comment />
      </Drawer>

      <div className="toolbar">
        <Button
          type="link"
          onClick={() => {
            onEvent.mainPageOpenComment();
            setIsDrawerVisible(true);
          }}
        >
          评论反馈
        </Button>
      </div>
    </div>
  );
};

export default MainPage;
