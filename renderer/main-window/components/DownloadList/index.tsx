import React, { ReactNode } from "react";
import { Button, Input, Modal, Space, Tag } from "antd";
import ProDescriptions from "@ant-design/pro-descriptions";
import ProTable from "@ant-design/pro-table";
import "./index.scss";
import tdApp from "renderer/common/scripts/td";
import * as Electron from "electron";
import variables from "renderer/common/scripts/variables";
import { SourceItem, SourceItemForm } from "types/common";
import MediaGoForm from "renderer/main-window/components/MegiaGoForm";
import { SourceStatus, SourceType } from "renderer/common/types";
import { ipcExec, ipcGetStore } from "renderer/main-window/utils";
import { insertVideo } from "renderer/common/scripts/localforge";
import { PlusOutlined } from "@ant-design/icons";

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

const statusMap = new Map([
  [SourceStatus.Ready, "#108ee9"],
  [SourceStatus.Failed, "#f50"],
  [SourceStatus.Success, "#87d068"],
  [SourceStatus.Downloading, "#2db7f5"],
]) as StatusMap;

// 下载列表
class DownloadList extends React.Component<Props, State> {
  actionRef = React.createRef();

  tableRef = React.createRef();

  constructor(props: Props) {
    super(props);

    this.state = {
      isModalVisible: false,
      isDrawerVisible: false,
      currentSourceItem: undefined,
    };
  }

  handleOk = async (item: SourceItemForm): Promise<void> => {
    const { updateTableData } = this.props;
    const sourceItem: SourceItem = {
      loading: false,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: "",
      title: item.title,
      duration: 0,
      url: item.url,
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
    const sourceItem: SourceItem = {
      loading: false,
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: "",
      title: item.title,
      duration: 0,
      url: item.url,
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
    const workspace = await ipcGetStore("local");
    const { title, headers, url } = item;
    const headersString = Object.entries(headers || {})
      .map(([key, value]) => `${key}:${value}`)
      .join("|");

    const { code, msg } = await ipcExec(
      exeFile,
      workspace,
      title,
      url,
      headersString
    );
    if (code === 0) {
      await changeSourceStatus(item, SourceStatus.Success);
      tdApp.onEvent("下载页面-下载视频成功", {
        msg,
        url,
        exeFile,
      });
    } else {
      await changeSourceStatus(item, SourceStatus.Failed);
      tdApp.onEvent("下载页面-下载视频失败", {
        msg,
        url,
        exeFile,
      });
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
  renderActionButtons = (value: string, row: SourceItem): ReactNode => {
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
    const { tableData } = this.props;
    return (
      <div className="">
        <ProTable<SourceItem>
          rowSelection={{}}
          options={false}
          rowKey="url"
          search={false}
          tableAlertRender={({
            selectedRowKeys,
            selectedRows,
            onCleanSelected,
          }) => (
            <Space size={24}>
              <span>
                已选 {selectedRowKeys.length} 项
                <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
                  取消选择
                </a>
              </span>
              <span>{`容器数量: ${selectedRows.reduce(
                (pre, item) => pre + item.containers,
                0
              )} 个`}</span>
              <span>{`调用量: ${selectedRows.reduce(
                (pre, item) => pre + item.callNumber,
                0
              )} 次`}</span>
            </Space>
          )}
          tableAlertOptionRender={() => (
            <Space size={16}>
              <a>批量删除</a>
              <a>导出数据</a>
            </Space>
          )}
          toolBarRender={() => [
            <Button
              onClick={() => {
                this.setState({ isModalVisible: true });
              }}
            >
              新建下载
            </Button>,
            <Button
              onClick={() => {
                tdApp.onEvent("下载页面-打开浏览器页面");
                ipcRenderer.send("openBrowserWindow");
              }}
            >
              打开浏览器
            </Button>,
            <Button
              onClick={async () => {
                await remote.shell.openExternal(variables.urls.help);
              }}
            >
              使用帮助
            </Button>,
          ]}
          columns={[
            {
              title: "标题",
              dataIndex: "title",
              className: "title",
              ellipsis: true,
              render: (text: string) => <span>{text}</span>,
            },
            {
              title: "详情",
              dataIndex: "url",
              render: (value, row) => (
                <div>
                  <div>分片数:{row.loading ? "正在加载" : row.title}</div>
                  <div>时长:{row.loading ? "正在加载" : row.title}</div>
                </div>
              ),
            },
            {
              title: "状态",
              filters: true,
              onFilter: true,
              valueType: "select",
              formItemProps: {
                rules: [
                  {
                    required: true,
                    message: "此项为必填项",
                  },
                ],
              },
              valueEnum: {
                all: { text: "全部", status: "Default" },
                open: {
                  text: "未解决",
                  status: "Error",
                },
                closed: {
                  text: "已解决",
                  status: "Success",
                  disabled: true,
                },
                processing: {
                  text: "解决中",
                  status: "Processing",
                },
              },
              render: (value, row) => (
                <Space size="middle">
                  <Tag color={statusMap.get(row.status)}>{row.status}</Tag>
                </Space>
              ),
            },
            {
              title: "创建时间",
              key: "createdAt",
              sorter: (a, b) => a.createdAt - b.createdAt,
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

        <MediaGoForm
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
