import * as React from "react";
import "./App.scss";
import { Badge, Button, Drawer, Dropdown, Menu, Tabs } from "antd";
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
import { ReactNode } from "react";
import { EllipsisOutlined } from "@ant-design/icons";
import { ipcGetStore } from "./utils";
import FeedImage from "./assets/feed.png";

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

interface Props {}

interface State {
  workspace: string;
  exeFile: string;
  isDrawerVisible: boolean;
  notifyCount: number;
  tableData: SourceItem[];
}

class App extends React.Component<Props, State> {
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

  constructor(props: Props) {
    super(props);

    this.state = {
      workspace: "",
      exeFile: "",
      isDrawerVisible: false,
      notifyCount: 0,
      tableData: [],
    };
  }

  async componentDidMount(): Promise<void> {
    // 开始初始化表格数据
    const tableData = await getVideos(1);
    const workspace = await ipcGetStore("local");
    const exeFile = await ipcGetStore("exeFile");
    this.setState({
      exeFile: exeFile || "",
      workspace: workspace || "",
      tableData,
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

  // 切换视频源的 status
  changeSourceStatus = async (
    source: SourceItem,
    status: SourceStatus
  ): Promise<void> => {
    await updateVideoStatus(source, status);
    const tableData = await getVideos(1);
    this.setState({ tableData });
  };

  // 更新表格的数据
  updateTableData = async (): Promise<void> => {
    const videos = await getVideos(1);
    this.setState({ tableData: videos });
  };

  render(): ReactNode {
    const {
      exeFile,
      workspace,
      isDrawerVisible,
      notifyCount,
      tableData,
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
            tabPosition="top"
            className="main-window-tabs"
            onChange={(value) => this.onTabChange(value as TabKey)}
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
              <Setting workspace={workspace} exeFile={exeFile} />
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
          <Button
            role="presentation"
            type="link"
            onClick={() => {
              this.setState({ isDrawerVisible: true });
            }}
          >
            评论反馈
          </Button>
          <Dropdown overlay={this.menu} placement="topRight">
            <EllipsisOutlined />
          </Dropdown>
        </div>
      </div>
    );
  }
}

export default App;
