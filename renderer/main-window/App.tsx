import * as React from "react";
import "./App.scss";
import { Button, Drawer, Tabs } from "antd";
import tdApp from "renderer/common/scripts/td";
import WindowToolBar from "renderer/common/components/WindowToolBar";
import DownloadList from "renderer/main-window/components/DownloadList";
import Setting from "renderer/main-window/components/Setting";
import variables from "renderer/common/scripts/variables";
import Comment from "renderer/main-window/components/Comment";
import FavList from "renderer/main-window/components/FavList";
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
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      workspace: "",
      exeFile: "",
      isDrawerVisible: false,
    };
  }

  async componentDidMount(): Promise<void> {
    const workspace = await ipcGetStore("local");
    const exeFile = await ipcGetStore("exeFile");

    this.setState({ exeFile: exeFile || "", workspace: workspace || "" });
  }

  onFinish = async (values: any) => {
    tdApp.onEvent("下载页面-开始下载");

    const { workspace, exeFile, name, url, headers } = values;
    const args = "";

    const { code, msg } = await ipcExec(
      exeFile,
      workspace,
      name,
      url,
      headers,
      args
    );
    if (code === 0) {
      tdApp.onEvent("下载页面-下载视频成功", { msg, url, exeFile });
    } else {
      tdApp.onEvent("下载页面-下载视频失败", { msg, url, exeFile });
    }
  };

  handleDrawerClose = () => {
    this.setState({ isDrawerVisible: false });
  };

  render() {
    const { exeFile, workspace, isDrawerVisible } = this.state;

    return (
      <div className="main-window">
        <WindowToolBar
          onClose={() => {
            ipcRenderer.send("closeMainWindow");
          }}
        />
        <div className="main-window">
          <Tabs tabPosition="top" className="main-window-tabs">
            <TabPane tab="下载" key="1">
              <DownloadList />
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
