import * as React from "react";
import { ReactNode } from "react";
import "./App.scss";
import { Badge, Button, Drawer, Dropdown, Menu, message, Tabs } from "antd";
import WindowToolBar from "renderer/common/components/WindowToolBar";
import DownloadList from "renderer/main-window/components/DownloadList";
import Setting from "renderer/main-window/components/Setting";
import variables from "renderer/common/scripts/variables";
import Comment from "renderer/main-window/components/Comment";
import FavList from "renderer/main-window/components/FavList";
import Electron from "electron";
import { SourceItem, SourceUrl } from "types/common";
import { SourceStatus, SourceType } from "renderer/common/types";
import {
  getVideos,
  insertVideo,
  updateVideoStatus,
} from "renderer/common/scripts/localforge";
import { EllipsisOutlined } from "@ant-design/icons";
import { ipcGetStore } from "./utils";
import audioSrc from "./assets/tip.mp3";

const audio = new Audio(audioSrc);

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

enum TabKey {
  HomeTab = "1",
  FavTab = "2",
  SettingTab = "3",
}

const { TabPane } = Tabs;

interface State {
  workspace: string;
  exeFile: string;
  isDrawerVisible: boolean;
  notifyCount: number;
  tableData: SourceItem[];
  activeKey: TabKey;
  tip: boolean; // 下载完成是否播放提示音
}

class App extends React.Component<null, State> {
  // 渲染右下角的菜单
  menu = (
    <Menu>
      <Menu.Item>
        <Button
          type="link"
          onClick={async () => {
            await remote.shell.openExternal(variables.urls.help);
          }}
        >
          更新日志
        </Button>
      </Menu.Item>
      <Menu.Item>
        <Button
          type="link"
          onClick={async () => {
            await remote.shell.openExternal(variables.urls.sourceUrl);
          }}
        >
          源码地址
        </Button>
      </Menu.Item>
    </Menu>
  );

  constructor(props: null) {
    super(props);

    this.state = {
      workspace: "",
      exeFile: "",
      isDrawerVisible: false,
      notifyCount: 0,
      tableData: [],
      activeKey: TabKey.HomeTab,
      tip: false,
    };
  }

  async componentDidMount(): Promise<void> {
    // 开始初始化表格数据
    const tableData = await getVideos(1);
    const workspace = await ipcGetStore("workspace");
    const exeFile = await ipcGetStore("exeFile");
    const tip = await ipcGetStore("tip");
    this.setState({
      exeFile: exeFile || "",
      workspace: workspace || "",
      tableData,
      activeKey: workspace ? TabKey.HomeTab : TabKey.SettingTab,
      tip,
    });

    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount(): void {
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage = async (
    e: Electron.IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const { notifyCount } = this.state;
    const item: SourceItem = {
      ...source,
      loading: true,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: "",
      createdAt: Date.now(),
    };
    const sourceItem = await insertVideo(item);
    if (!sourceItem) return;
    const tableData = await getVideos(1);
    this.setState({ tableData, notifyCount: notifyCount + 1 });
  };

  handleDrawerClose = (): void => {
    this.setState({ isDrawerVisible: false });
  };

  // 首页面板切换事件
  onTabChange = (activeKey: TabKey): void => {
    if (activeKey === TabKey.HomeTab) {
      this.setState({ notifyCount: 0 });
    }
  };

  // 首页面板点击事件
  onTabClick = async (activeKey: TabKey): Promise<void> => {
    const { workspace } = this.state;
    if (!workspace) {
      message.error("请选择本地路径");
      return;
    }
    this.setState({ activeKey });
  };

  // 切换视频源的 status
  changeSourceStatus = async (
    source: SourceItem,
    status: SourceStatus
  ): Promise<void> => {
    const { tip } = this.state;
    if (status === SourceStatus.Success && tip) {
      await audio.play();
    }
    await updateVideoStatus(source, status);
    const tableData = await getVideos(1);
    this.setState({ tableData });
  };

  // 更新表格的数据
  updateTableData = async (): Promise<void> => {
    const videos = await getVideos(1);
    this.setState({ tableData: videos });
  };

  // 工作目录选择事件
  onWorkspaceChange = (workspace: string) => {
    this.setState({ workspace });
  };

  render(): ReactNode {
    const {
      exeFile,
      workspace,
      isDrawerVisible,
      notifyCount,
      tableData,
      activeKey,
      tip,
    } = this.state;

    return (
      <div className="main-window">
        <WindowToolBar
          color="#4090F7"
          onClose={() => {
            ipcRenderer.send("closeMainWindow");
          }}
        />
        <div className="main-window">
          <Tabs
            activeKey={activeKey}
            tabPosition="top"
            className="main-window-tabs"
            onChange={(value) => this.onTabChange(value as TabKey)}
            onTabClick={(key) => this.onTabClick(key as TabKey)}
          >
            <TabPane
              tab={
                <Badge className="download-item" count={notifyCount}>
                  下载
                </Badge>
              }
              key={TabKey.HomeTab}
            >
              <DownloadList
                workspace={workspace}
                tableData={tableData}
                changeSourceStatus={this.changeSourceStatus}
                updateTableData={this.updateTableData}
              />
            </TabPane>
            <TabPane tab="收藏" key={TabKey.FavTab}>
              <FavList />
            </TabPane>
            <TabPane tab="设置" key={TabKey.SettingTab}>
              <Setting
                workspace={workspace}
                exeFile={exeFile}
                tip={tip}
                onWorkspaceChange={this.onWorkspaceChange}
              />
            </TabPane>
          </Tabs>
        </div>

        <Drawer
          title="评论反馈"
          placement="right"
          closable={false}
          width={500}
          onClose={this.handleDrawerClose}
          visible={isDrawerVisible}
          className="comment-drawer"
        >
          <Comment />
        </Drawer>

        <div className="toolbar">
          {/*<Button*/}
          {/*  role="presentation"*/}
          {/*  type="link"*/}
          {/*  onClick={() => {*/}
          {/*    this.setState({ isDrawerVisible: true });*/}
          {/*  }}*/}
          {/*>*/}
          {/*  评论反馈*/}
          {/*</Button>*/}
          <Dropdown overlay={this.menu} placement="topRight">
            <EllipsisOutlined />
          </Dropdown>
        </div>
      </div>
    );
  }
}

export default App;
