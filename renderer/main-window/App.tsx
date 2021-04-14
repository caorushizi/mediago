import * as React from "react";
import "./App.scss";
import { Badge, Button, Drawer, Tabs } from "antd";
import tdApp from "renderer/common/scripts/td";
import WindowToolBar from "renderer/common/components/WindowToolBar";
import DownloadList from "renderer/main-window/components/DownloadList";
import Setting from "renderer/main-window/components/Setting";
import variables from "renderer/common/scripts/variables";
import Comment from "renderer/main-window/components/Comment";
import FavList from "renderer/main-window/components/FavList";
import Electron from "electron";
import { SourceItem, SourceUrl } from "types/common";
import { SourceStatus, SourceType } from "renderer/common/types";
import { insertVideo } from "renderer/common/scripts/localforge";
import { ReactNode } from "react";
import TipMedia from "./assets/tip.mp3";
import { ipcExec, ipcGetStore } from "./utils";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

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
    const workspace = await ipcGetStore("local");
    const exeFile = await ipcGetStore("exeFile");
    this.setState({ exeFile: exeFile || "", workspace: workspace || "" });

    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount(): void {
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage = async (
    e: Electron.IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const item: SourceItem = {
      ...source,
      loading: true,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
    };
    const tableData = await insertVideo(item);
    this.setState({ tableData: tableData.slice(0, 20) });
  };

  handleDrawerClose = () => {
    this.setState({ isDrawerVisible: false });
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
          onClose={() => {
            ipcRenderer.send("closeMainWindow");
          }}
        />
        <div className="main-window">
          <Tabs tabPosition="top" className="main-window-tabs">
            <TabPane tab={<Badge count={notifyCount}>下载</Badge>} key="1">
              <DownloadList tableData={tableData} />
            </TabPane>
            <TabPane tab="收藏" key="2">
              <FavList />
            </TabPane>
            <TabPane tab="设置" key="3">
              <Setting workspace={workspace} exeFile={exeFile} />
            </TabPane>
          </Tabs>
        </div>

        <button
          type="button"
          className="float-icon"
          onClick={() => {
            this.setState({ isDrawerVisible: true });
          }}
        >
          评论反馈
        </button>

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
          <div className="left" />
          <div className="right">
            <Button
              type="link"
              onClick={async () => {
                await remote.shell.openExternal(variables.urls.help);
              }}
            >
              更新日志
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
