import * as React from "react";
import { ReactNode } from "react";
import "./index.scss";
import { Badge, Button, Drawer, Dropdown, Menu, message, Tabs } from "antd";
import WindowToolBar from "renderer/components/WindowToolBar";
import DownloadList from "renderer/nodes/main/elements/DownloadList";
import Setting from "renderer/nodes/main/elements/Setting";
import variables from "renderer/utils/variables";
import Comment from "renderer/components/Comment";
import { SourceItem, SourceUrl } from "types/common";
import { SourceStatus, SourceType } from "renderer/types";
import {
  getVideos,
  insertVideo,
  updateVideoStatus,
} from "renderer/utils/localforge";
import { EllipsisOutlined } from "@ant-design/icons";
import audioSrc from "../../assets/tip.mp3";
import onEvent from "renderer/utils/td-utils";
import { connect, ConnectedProps } from "react-redux";
import { Dispatch } from "redux";
import { updateSettings } from "renderer/store/actions/settings.actions";
import { AppState } from "renderer/store/reducers";
import { Settings } from "renderer/store/models/settings";
import electron from "renderer/utils/electron";
import { request } from "renderer/utils";

const audio = new Audio(audioSrc);

enum TabKey {
  HomeTab = "1",
  FavTab = "2",
  SettingTab = "3",
}

const { TabPane } = Tabs;

interface State {
  isDrawerVisible: boolean;
  notifyCount: number;
  tableData: SourceItem[];
  activeKey: TabKey;
}

class MainPage extends React.Component<PropsFromRedux, State> {
  // 渲染右下角的菜单
  menu = (
    <Menu>
      <Menu.Item>
        <Button
          type="link"
          onClick={() => {
            onEvent.mainUpdateLog();
            electron.openExternal(variables.urls.help);
          }}
        >
          更新日志
        </Button>
      </Menu.Item>
      <Menu.Item>
        <Button
          type="link"
          onClick={() => {
            onEvent.mainPageSourceCode();
            electron.openExternal(variables.urls.sourceUrl);
          }}
        >
          源码地址
        </Button>
      </Menu.Item>
    </Menu>
  );

  constructor(props: PropsFromRedux) {
    super(props);

    this.state = {
      isDrawerVisible: false,
      notifyCount: 0,
      tableData: [],
      activeKey: TabKey.HomeTab,
    };
  }

  async componentDidMount(): Promise<void> {
    // 开始初始化表格数据
    const tableData = await getVideos();
    const { setSettings } = this.props;
    const initialSettings = await window.electron.store.get();
    setSettings(initialSettings);
    this.setState({
      tableData,
      activeKey: initialSettings.workspace ? TabKey.HomeTab : TabKey.SettingTab,
    });

    electron.addEventListener("m3u8", this.handleWebViewMessage);

    const resp = await request({
      method: "post",
      url: "https://baidu.com",
      data: {
        username: 123,
        password: 123,
      },
    });
    console.log("resp", resp);
  }

  componentWillUnmount(): void {
    electron.removeEventListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage = async (
    e: Electron.IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const { notifyCount } = this.state;
    const { settings } = this.props;
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
    const { settings } = this.props;
    if (!settings.workspace) {
      message.error("请选择本地路径");
      return;
    }
    if (activeKey === TabKey.FavTab) {
      onEvent.toFavPage();
    } else if (activeKey === TabKey.SettingTab) {
      onEvent.toSettingPage();
    } else if (activeKey === TabKey.HomeTab) {
      onEvent.toMainPage();
    }
    this.setState({ activeKey });
  };

  // 切换视频源的 status
  changeSourceStatus = async (
    source: SourceItem,
    status: SourceStatus
  ): Promise<void> => {
    const { settings } = this.props;
    if (status === SourceStatus.Success && settings.tip) {
      await audio.play();
    }
    await updateVideoStatus(source, status);
    const tableData = await getVideos();
    this.setState({ tableData });
  };

  // 更新表格的数据
  updateTableData = async (): Promise<void> => {
    const videos = await getVideos();
    this.setState({ tableData: videos });
  };

  render(): ReactNode {
    const { isDrawerVisible, notifyCount, tableData, activeKey } = this.state;
    const { settings } = this.props;
    const { workspace, exeFile, tip } = settings;

    return (
      <div className="main-window">
        <WindowToolBar
          color="#4090F7"
          onClose={() => {
            electron.closeMainWindow();
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
            <TabPane tab="设置" key={TabKey.SettingTab}>
              <Setting workspace={workspace} exeFile={exeFile} tip={tip} />
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
            type="link"
            onClick={() => {
              onEvent.mainPageOpenComment();
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

const mapStateToProps = (state: AppState) => ({
  settings: state.settings.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setSettings: (settings: Partial<Settings>) =>
      dispatch(updateSettings(settings)),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MainPage);
