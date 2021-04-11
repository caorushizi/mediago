import React from "react";
import {
  Button,
  Collapse,
  Drawer,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import "./index.scss";
import tdApp from "renderer/common/scripts/td";
import * as Electron from "electron";
import variables from "renderer/common/scripts/variables";
import M3u8Form from "renderer/main-window/components/M3u8Form";
import { SourceUrl } from "types/common";
import MediaGoForm from "renderer/main-window/components/MegiaGoForm";
import { getVideos, insertVideo } from "renderer/common/scripts/localforge";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

interface Props {}
interface State {
  isModalVisible: boolean;
  isDrawerVisible: boolean;
  tableData: SourceUrl[];
  page: number;
}

class DownloadList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isModalVisible: false,
      isDrawerVisible: false,
      tableData: [],
      page: 1,
    };
  }

  async componentDidMount(): Promise<void> {
    const { page } = this.state;
    const tableData = await getVideos(page);
    this.setState({ tableData });
    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage = async (
    e: Electron.IpcRendererEvent,
    source: SourceUrl
  ): Promise<void> => {
    const tableData = await insertVideo(source);
    const { page } = this.state;
    this.setState({ tableData: tableData.slice(page, 20) });
  };

  handleOk = (): void => {
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

  render() {
    const { isModalVisible, isDrawerVisible, tableData } = this.state;
    return (
      <div className="download-list">
        <Space>
          <Button
            onClick={() => {
              this.setState({ isModalVisible: true });
            }}
          >
            新建下载
          </Button>
          <Button
            onClick={() => {
              tdApp.onEvent("下载页面-打开浏览器页面");
              ipcRenderer.send("openBrowserWindow");
            }}
          >
            打开浏览器
          </Button>
          <Button
            onClick={async () => {
              await remote.shell.openExternal(variables.urls.help);
            }}
          >
            使用帮助
          </Button>
        </Space>
        <Table
          rowSelection={{}}
          columns={[
            {
              title: "标题",
              dataIndex: "title",
              key: "title",
              render: (text: string) => <span>{text}</span>,
            },
            {
              title: "详情",
              dataIndex: "url",
              key: "url",
              render: (value, row) => (
                <div>
                  <div>分片数:{row.title}</div>
                  <div>时长:{row.title}</div>
                </div>
              ),
            },
            {
              title: "状态",
              key: "action",
              render: (value, row) => (
                <Space size="middle">
                  <Tag color="volcano">正在下载</Tag>
                </Space>
              ),
            },
            {
              title: "操作",
              key: "action",
              render: (value, row) => (
                <Space>
                  <Button type="link">下载</Button>
                  <Button
                    type="link"
                    onClick={() => {
                      this.setState({
                        isDrawerVisible: true,
                      });
                    }}
                  >
                    详情
                  </Button>
                </Space>
              ),
            },
          ]}
          dataSource={tableData}
        />
        <Modal
          title="新建下载"
          visible={isModalVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <MediaGoForm />
        </Modal>
        <Drawer
          width={500}
          title="视频详情"
          placement="right"
          onClose={this.handleDrawerClose}
          visible={isDrawerVisible}
          className="download-drawer"
          footer={
            <div>
              <Space>
                <Button type="primary">保存</Button>
                <Button>取消</Button>
              </Space>
            </div>
          }
        >
          <div className="item">
            <div className="label">视频标题：</div>
            <div className="value">盗墓笔记</div>
          </div>
          <div className="item">
            <div className="label">m3u8地址：</div>
            <div className="value">http://baidu.com</div>
          </div>
          <div className="item">
            <div className="label">分片数：</div>
            <div className="value">123</div>
          </div>
          <div className="item">
            <div className="label">时长：</div>
            <div className="value">123123</div>
          </div>
          <div className="item">
            <div className="label">请求标头：</div>
            <div className="value">
              :authority: stats.g.doubleclick.net <br />
              :method: POST
              <br />
              :path:
              /j/collect?t=dc&aip=1&_r=3&v=1&_v=j89&tid=UA-72788897-1&cid=1353696824.1612031808&jid=1795274895&gjid=1458936427&_gid=562285368.1618061588&_u=AACAAUAAAAAAAC~&z=476229443
              <br />
              :scheme: https
              <br />
              accept: */*
              <br />
              accept-encoding: gzip, deflate, br
              <br />
              accept-language: zh-CN,zh;q=0.9,en;q=0.8
              <br />
              content-length: 0<br />
              content-type: text/plain
              <br />
            </div>
          </div>
          <div className="item">
            <div className="label">执行程序：</div>
            <div className="value">
              <Select defaultValue="lucy" style={{ width: 120 }}>
                <Select.Option value="jack">mediago</Select.Option>
                <Select.Option value="lucy">mediago</Select.Option>
              </Select>
            </div>
          </div>
          <Collapse defaultActiveKey={["1"]} ghost>
            <Collapse.Panel header="更多参数" key="1">
              <M3u8Form />
            </Collapse.Panel>
          </Collapse>
        </Drawer>
      </div>
    );
  }
}

export default DownloadList;
