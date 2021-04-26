import React, { ReactNode } from "react";
import { Button, Input, Modal, Popconfirm, Space, Tag } from "antd";
import ProDescriptions from "@ant-design/pro-descriptions";
import ProTable from "@ant-design/pro-table";
import "./index.scss";
import tdApp from "renderer/common/scripts/td";
import * as Electron from "electron";
import variables from "renderer/common/scripts/variables";
import {
  M3u8DLArgs,
  MediaGoArgs,
  SourceItem,
  SourceItemForm,
} from "types/common";
import NewSourceForm from "./NewSourceForm";
import { ipcExec, ipcGetStore } from "renderer/main-window/utils";
import { insertVideo, removeVideos } from "renderer/common/scripts/localforge";
import { SourceStatus, SourceType } from "renderer/common/types";
import moment from "moment";
import {
  AppstoreAddOutlined,
  BlockOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { AppStateContext } from "renderer/main-window/types";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

type ActionButton = {
  text: string;
  cb: () => void;
};

interface Props {
  tableData: SourceItem[];
  changeSourceStatus: (
    source: SourceItem,
    status: SourceStatus
  ) => Promise<void>;
  workspace: string;
  updateTableData: () => Promise<void>;
}

interface State {
  isModalVisible: boolean;
  isDrawerVisible: boolean;
  currentSourceItem?: SourceItem;
}

type StatusMap = { get<T extends SourceStatus>(status: T): string };

const statusColorMap = new Map([
  [SourceStatus.Ready, "#108ee9"],
  [SourceStatus.Failed, "#f50"],
  [SourceStatus.Success, "#87d068"],
  [SourceStatus.Downloading, "#2db7f5"],
]) as StatusMap;

const statusTextMap = new Map([
  [SourceStatus.Ready, "未下载"],
  [SourceStatus.Failed, "下载失败"],
  [SourceStatus.Success, "下载成功"],
  [SourceStatus.Downloading, "正在下载"],
]);

// 下载列表
class DownloadList extends React.Component<Props, State> {
  actionRef = React.createRef();

  static contextType = AppStateContext;

  constructor(props: Props) {
    super(props);

    this.state = {
      isModalVisible: false,
      isDrawerVisible: false,
      currentSourceItem: undefined,
    };
  }

  handleOk = async (item: SourceItemForm): Promise<void> => {
    console.log("item: ", item);
    const { updateTableData } = this.props;
    const { workspace } = this.context;
    console.log(workspace);
    const sourceItem: SourceItem = {
      loading: false,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: workspace,
      title: item.title,
      duration: 0,
      url: item.url,
      deleteSegments: item.delete,
      createdAt: Date.now(),
    };
    await insertVideo(sourceItem);
    await updateTableData();
    this.setState({
      isModalVisible: false,
    });
  };

  // 立即下载
  handleDownload = async (item: SourceItemForm): Promise<void> => {
    const { updateTableData } = this.props;
    const { workspace } = this.context;
    const sourceItem: SourceItem = {
      loading: false,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: workspace,
      title: item.title,
      duration: 0,
      url: item.url,
      createdAt: Date.now(),
      deleteSegments: item.delete,
    };
    await insertVideo(sourceItem);
    await updateTableData();
    await this.downloadFile(sourceItem);
    this.setState({
      isModalVisible: false,
    });
  };

  handleCancel = (): void => {
    this.setState({
      isModalVisible: false,
    });
  };

  // 抽屉关闭事件
  handleDrawerClose = (): void => {
    this.setState({
      isDrawerVisible: false,
    });
  };

  // 下载文件
  downloadFile = async (item: SourceItem): Promise<void> => {
    const { changeSourceStatus } = this.props;
    await changeSourceStatus(item, SourceStatus.Downloading);
    tdApp.onEvent("下载页面-开始下载");
    const exeFile = await ipcGetStore("exeFile");
    const workspace = await ipcGetStore("workspace");
    const { title, headers, url } = item;

    let args: MediaGoArgs | M3u8DLArgs;
    if (exeFile === "mediago") {
      const headersString = Object.entries(headers || {})
        .map(([key, value]) => `${key}~${value}`)
        .join("|");
      args = {
        url,
        path: workspace, // 设定程序工作目录
        name: title, // 设定存储文件名(不包括后缀)
        headers: headersString,
      };
    } else {
      const headersString = Object.entries(headers || {})
        .map(([key, value]) => `${key}:${value}`)
        .join("|");
      args = {
        url,
        workDir: workspace, // 设定程序工作目录
        saveName: title, // 设定存储文件名(不包括后缀)
        headers: headersString,
      };
    }

    const { code, msg } = await ipcExec(exeFile, args);
    if (code === 0) {
      await changeSourceStatus(item, SourceStatus.Success);

      const kv = { msg, url, exeFile };
      tdApp.onEvent("下载页面-下载视频成功", kv);
    } else {
      await changeSourceStatus(item, SourceStatus.Failed);

      const kv = { msg, url, exeFile };
      tdApp.onEvent("下载页面-下载视频失败", kv);
    }
  };

  // 展示资源详情
  showSourceDetail = (item: SourceItem): void => {
    this.setState({
      isDrawerVisible: true,
      currentSourceItem: item,
    });
  };

  // 打开所在文件夹
  openDirectory = async (): Promise<void> => {
    const { workspace } = this.props;
    await remote.shell.openPath(workspace);
  };

  // 渲染操作按钮
  renderActionButtons = (dom: React.ReactNode, row: SourceItem): ReactNode => {
    const buttons: ActionButton[] = [];
    switch (row.status) {
      case SourceStatus.Success:
        // 下载成功
        buttons.push({
          text: "打开目录",
          cb: this.openDirectory,
        });
        buttons.push({
          text: "详情",
          cb: () => this.showSourceDetail(row),
        });
        break;
      case SourceStatus.Failed:
        // 下载失败
        buttons.push({
          text: "重新下载",
          cb: () => this.downloadFile(row),
        });
        buttons.push({
          text: "详情",
          cb: () => this.showSourceDetail(row),
        });
        break;
      case SourceStatus.Downloading:
        // 正在下载
        // buttons.push();
        // buttons.push({ text: "设置为成功", cb: () => {} });
        break;
      default:
        // 准备状态
        buttons.push({
          text: "下载",
          cb: () => this.downloadFile(row),
        });
        buttons.push({
          text: "详情",
          cb: () => this.showSourceDetail(row),
        });
        break;
    }
    return buttons.map((button) => <a onClick={button.cb}>{button.text}</a>);
  };

  render(): ReactNode {
    const { isModalVisible, isDrawerVisible, currentSourceItem } = this.state;
    const { tableData, updateTableData } = this.props;
    // TODO: 在浏览器中嗅探成功后，自动解析 m3u8 文件，在页面中展示详情
    return (
      <div className="download-list">
        <ProTable<SourceItem>
          rowSelection={{}}
          options={false}
          rowKey="url"
          search={false}
          tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
            <Space size={24}>
              <span>
                已选 {selectedRowKeys.length} 项
                <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
                  取消选择
                </a>
              </span>
            </Space>
          )}
          tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => [
            <Button type="link">批量下载</Button>,
            <Popconfirm
              placement="bottomRight"
              title="确认要删除选中项目吗？"
              onConfirm={async () => {
                await removeVideos(selectedRowKeys);
                await updateTableData();
                onCleanSelected();
              }}
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>,
          ]}
          toolBarRender={() => [
            <Button
              onClick={() => {
                this.setState({ isModalVisible: true });
              }}
            >
              <AppstoreAddOutlined />
              新建下载
            </Button>,
            <Button
              onClick={() => {
                tdApp.onEvent("下载页面-打开浏览器页面");
                ipcRenderer.send("openBrowserWindow");
              }}
            >
              <BlockOutlined />
              打开浏览器
            </Button>,
            <Button
              onClick={async () => {
                await remote.shell.openExternal(variables.urls.help);
              }}
            >
              <QuestionCircleOutlined />
              使用帮助
            </Button>,
          ]}
          columns={[
            {
              title: "标题",
              dataIndex: "title",
              className: "title",
              ellipsis: true,
              render: (dom: React.ReactNode) => dom,
            },
            {
              title: "创建时间",
              key: "createdAt",
              dataIndex: "createdAt",
              sorter: (a, b) => a.createdAt - b.createdAt,
              render: (dom, item) =>
                moment(item.createdAt).format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              title: "状态",
              filters: true,
              onFilter: true,
              dataIndex: "status",
              initialValue: "all",
              valueType: "select",
              valueEnum: {
                all: {
                  text: "全部",
                  status: "Default",
                },
                ready: {
                  text: statusTextMap.get(SourceStatus.Ready),
                  status: statusTextMap.get(SourceStatus.Ready),
                },
                downloading: {
                  text: statusTextMap.get(SourceStatus.Downloading),
                  status: statusTextMap.get(SourceStatus.Downloading),
                },
                failed: {
                  text: statusTextMap.get(SourceStatus.Failed),
                  status: statusTextMap.get(SourceStatus.Failed),
                },
                success: {
                  text: statusTextMap.get(SourceStatus.Success),
                  status: statusTextMap.get(SourceStatus.Success),
                },
              },
              render: (value, row) => (
                <Tag color={statusColorMap.get(row.status)}>
                  {statusTextMap.get(row.status)}
                </Tag>
              ),
            },
            {
              title: "操作",
              key: "action",
              valueType: "option",
              render: this.renderActionButtons,
            },
          ]}
          dataSource={tableData}
          // scroll={{ y: "calc(100vh - 310px)" }}
        />

        <NewSourceForm
          visible={isModalVisible}
          handleCancel={this.handleCancel}
          handleOk={this.handleOk}
          handleDownload={this.handleDownload}
        />

        <Modal
          width={500}
          title="视频详情"
          onCancel={this.handleDrawerClose}
          visible={isDrawerVisible}
          footer={
            <Space>
              <Button>立即下载</Button>
              <Button>取消</Button>
              <Button type="primary">确定</Button>
            </Space>
          }
        >
          <ProDescriptions
            actionRef={this.actionRef}
            layout="horizontal"
            formProps={{
              onValuesChange: (e, f) => console.log(f),
            }}
            column={1}
            request={async () =>
              Promise.resolve({
                success: true,
                data: currentSourceItem,
              })
            }
            editable={{}}
            columns={[
              {
                title: "视频标题",
                key: "title",
                dataIndex: "title",
              },
              {
                title: "m3u8地址",
                key: "url",
                dataIndex: "url",
              },
              {
                title: "分片数",
                key: "duration",
                dataIndex: "duration",
                renderFormItem: () => <Input />,
              },
              {
                title: "时长",
                key: "duration",
                dataIndex: "duration",
                valueType: "date",
              },
              {
                title: "执行程序",
                key: "exeFile",
                dataIndex: "exeFile",
                valueType: "select",
                valueEnum: {
                  open: {
                    text: "mediago",
                  },
                  closed: {
                    text: "m3u8",
                  },
                },
              },
            ]}
          />
        </Modal>
      </div>
    );
  }
}

export default DownloadList;
