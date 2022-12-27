import React, {
  DragEvent as ReactDragEvent,
  FC,
  ReactNode,
  useEffect,
  useState,
} from "react";
import "./index.scss";
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { VideoStatus } from "../../types";
import audioSrc from "../../assets/tip.mp3";
import { onEvent } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { Settings, updateSettings } from "../../store/actions/settings.actions";
import { AppState } from "../../store/reducers";
import { updateNotifyCount } from "../../store/actions/main.actions";
import { useRequest } from "ahooks";
import { getVideoList } from "../../assets/api";
import { FileDrop } from "react-file-drop";
import HeaderEdit from "../../components/HeaderEdit";
import { AppstoreAddOutlined } from "@ant-design/icons";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import classNames from "classnames";

const audio = new Audio(audioSrc);

interface ActionButton {
  key: string;
  text: string | ReactNode;
  tooltip?: string;
  title?: string;
  showTooltip?: boolean;
  cb: () => void;
}

const colorMap = {
  ready: "#108ee9",
  downloading: "#2db7f5",
  failed: "#f50",
  success: "#87d068",
};

const titleMap = {
  ready: "未下载",
  downloading: "正在下载",
  failed: "下载失败",
  success: "下载成功",
};

const {
  store,
  itemContextMenu,
  addEventListener,
  removeEventListener,
  ipcExec,
} = window.electron;

const MainPage: FC = () => {
  const { data, run } = useRequest(getVideoList);
  const dispatch = useDispatch();
  const settings = useSelector<AppState, Settings>((state) => state.settings);

  const { workspace, exeFile } = settings;

  const initData = async () => {
    // 开始初始化表格数据
    const initialSettings = await store.get();
    dispatch(updateSettings(initialSettings));
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
    run();
  };

  // 更新表格的数据
  const updateTableData = async (): Promise<void> => {
    run();
  };

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [formRef] = Form.useForm();
  const [detailForm] = Form.useForm();

  useEffect(() => {
    void initData();

    addEventListener("download-context-menu-detail", contextMenuDetail);
    addEventListener("download-context-menu-download", contextMenuDownload);
    addEventListener("download-context-menu-delete", contextMenuDelete);
    addEventListener("download-context-menu-clear-all", contextMenuClearAll);

    return () => {
      removeEventListener("download-context-menu-detail", contextMenuDetail);
      removeEventListener(
        "download-context-menu-download",
        contextMenuDownload
      );
      removeEventListener("download-context-menu-delete", contextMenuDelete);
      removeEventListener(
        "download-context-menu-clear-all",
        contextMenuClearAll
      );
    };
  }, []);

  const contextMenuDetail = (e: any, item: SourceItem): void => {
    detailForm.setFieldsValue(item);
  };
  const contextMenuDownload = (e: any, item: SourceItem): void => {
    downloadFile(item);
  };
  const contextMenuDelete = async (
    event: any,
    item: SourceItem
  ): Promise<void> => {
    await window.electron.removeVideo(item.id);
    await updateTableData();
  };
  const contextMenuClearAll = async (): Promise<void> => {
    await window.electron.removeVideo();
    await updateTableData();
  };

  // 渲染视频下载的状态
  const renderStatus = (item: SourceItem): ReactNode => {
    const status = item.status;
    return (
      <Tooltip title={titleMap[status]} placement={"right"}>
        <div
          style={{
            height: "8px",
            width: "8px",
            borderRadius: "4px",
            background: colorMap[status],
          }}
        />
      </Tooltip>
    );
  };

  // 点击取消新建下载
  const handleCancel = (): void => {
    setIsModalVisible(false);
  };

  // 新建下载
  const newDownload = (): void => {
    onEvent.mainPageNewSource();
    setIsModalVisible(true);
  };

  // 向列表中插入一条数据并且请求详情
  const insertUpdateTableData = async (
    item: SourceItemForm
  ): Promise<Video> => {
    console.log("item: ", item);
    const video: Video = {
      status: VideoStatus.Ready,
      name: item.name,
      url: item.url,
    };
    await window.electron.addVideo(video);
    await updateTableData();
    setIsModalVisible(false);
    return video;
  };

  // 下载文件
  const downloadFile = async (item: SourceItem): Promise<void> => {
    await changeVideoStatus(item, VideoStatus.Downloading);
    onEvent.tableStartDownload();
    const { name, headers, url, exeFile: formExeFile } = item;

    const exeFile = formExeFile || (await window.electron.store.get("exeFile"));
    const workspace = await window.electron.store.get("workspace");

    let args: MediaGoArgs | M3u8DLArgs;
    if (exeFile === "mediago") {
      const headersString = Object.entries(headers != null || {})
        .map(([key, value]) => `${key}~${value}`)
        .join("|");
      args = {
        url,
        path: workspace, // 设定程序工作目录
        name, // 设定存储文件名(不包括后缀)
        headers: headersString,
      };
    } else {
      const {
        checkbox,
        maxThreads,
        minThreads,
        retryCount,
        timeOut,
        stopSpeed,
        maxSpeed,
      } = item;
      const checkboxObj = Object.values(checkbox != null || []).reduce(
        (prev: Record<string, boolean>, cur) => {
          prev[cur] = true;
          return prev;
        },
        {}
      );
      const headersString = Object.entries(headers != null || {})
        .map(([key, value]) => `${key}:${value}`)
        .join("|");
      args = {
        url,
        workDir: workspace, // 设定程序工作目录
        saveName: name, // 设定存储文件名(不包括后缀)
        headers: headersString,
        enableDelAfterDone: item.deleteSegments,
        ...checkboxObj,
        maxThreads,
        minThreads,
        retryCount,
        timeOut,
        stopSpeed,
        maxSpeed,
      };
    }

    const { code, msg } = await ipcExec(exeFile, args);
    if (code === 0) {
      await changeVideoStatus(item, VideoStatus.Success);
      onEvent.mainPageDownloadSuccess();
    } else {
      message.error(msg);
      await changeVideoStatus(item, VideoStatus.Failed);
      onEvent.mainPageDownloadFail();
    }
  };

  // 新建下载窗口点击确定按钮
  const handleOk = async (): Promise<void> => {
    if (formRef && (await formRef.validateFields())) {
      const item = formRef.getFieldsValue();
      formRef.resetFields();

      onEvent.addSourceAddSource();
      await insertUpdateTableData(item);
    }
  };

  // 新建下载窗口点击立即下载
  const handleDownload = async (): Promise<void> => {
    if (formRef && (await formRef.validateFields())) {
      const item = formRef.getFieldsValue();
      formRef.resetFields();

      onEvent.addSourceDownload();
      const sourceItem = await insertUpdateTableData(item);
      await downloadFile(sourceItem);
    }
  };

  // 渲染页面上方的按钮
  const renderToolBar = (): ReactNode => {
    return (
      <div
        style={{
          padding: "10px",
          borderBottom: "1px solid #EBEEF5",
        }}
      >
        <Space>
          <Button
            key={"1"}
            onClick={newDownload}
            icon={<AppstoreAddOutlined />}
            size={"middle"}
          >
            新建下载
          </Button>
        </Space>
      </div>
    );
  };

  // 打开所在文件夹
  const openDirectory = () => {
    void window.electron.openPath(workspace);
  };

  // 渲染操作按钮
  const renderActionButtons = (row: SourceItem): ReactNode => {
    const buttons: ActionButton[] = [];
    switch (row.status) {
      case VideoStatus.Success:
        // 下载成功
        buttons.push({
          key: "1",
          text: (
            <Button type={"link"} size={"small"}>
              打开文件位置
            </Button>
          ),
          title: "打开文件位置",
          cb: openDirectory,
        });
        buttons.push({
          key: "2",
          text: (
            <Button type={"link"} size={"small"}>
              重新下载
            </Button>
          ),
          title: "重新下载",
          cb: async () => await downloadFile(row),
        });
        break;
      case VideoStatus.Failed:
        // 下载失败
        buttons.push({
          key: "3",
          text: (
            <Button type={"link"} size={"small"}>
              重新下载
            </Button>
          ),
          title: "重新下载",
          cb: async () => await downloadFile(row),
        });
        break;
      case VideoStatus.Downloading:
        // 正在下载
        buttons.push({
          key: "5",
          text: (
            <Button type={"link"} size={"small"}>
              重置状态
            </Button>
          ),
          title: "重置状态",
          showTooltip: true,
          tooltip:
            "如果下载过程中将主程序关闭，那么主程序将无法接收到下载成功的消息，可以通过重置状态将状态改为未下载状态",
          cb: async () => {
            onEvent.tableReNewStatus();
            await window.electron.updateVideo(row.id, {
              status: VideoStatus.Ready,
            });
            await updateTableData();
          },
        });
        break;
      default:
        // 准备状态
        buttons.push({
          key: "6",
          text: (
            <Button type={"link"} size={"small"}>
              下载
            </Button>
          ),
          title: "下载",
          cb: async () => await downloadFile(row),
        });
        break;
    }
    return (
      <div style={{ display: "flex" }}>
        {buttons.map((button) =>
          button.showTooltip ? (
            <Tooltip title={button.tooltip} placement={"left"}>
              <div
                style={{ paddingLeft: "10px" }}
                key={button.key}
                onClick={button.cb}
                title={button.title}
              >
                {button.text}
              </div>
            </Tooltip>
          ) : (
            <div
              style={{ paddingLeft: "10px" }}
              key={button.key}
              onClick={button.cb}
              title={button.title}
            >
              {button.text}
            </div>
          )
        )}
      </div>
    );
  };

  // 文件放入事件
  const onDrop = async (
    files: FileList | null,
    event: ReactDragEvent<HTMLDivElement>
  ) => {
    if (files?.length === 1) {
      // 只有一个文件被拽入
      await setIsModalVisible(true);
      const [file] = files;
      formRef?.setFieldsValue({ url: file.path });
    }
  };

  const renderTaskList = () => {
    return (
      <AutoSizer className={"new-download-list"}>
        {({ height, width }) => (
          <List<SourceItem[]>
            height={height}
            itemSize={35}
            width={width}
            itemData={data}
            itemCount={data?.length || 0}
            itemKey={(index, data) => {
              const item = data[index];
              return item.id || `${item.name}-${index}`;
            }}
          >
            {({ index, style, data }) => {
              const item = data[index];

              return (
                <div
                  className={classNames("list-item-container")}
                  style={{
                    ...style,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0 15px",
                  }}
                  title={item.name}
                  onContextMenu={() => {
                    itemContextMenu(item);
                  }}
                >
                  {renderStatus(item)}
                  <div
                    style={{
                      flex: 1,
                    }}
                    className={"list-item-inner"}
                    onClick={() => {
                      const { exeFile } = settings;
                      detailForm.setFieldsValue({ ...item, exeFile });
                      dispatch(updateNotifyCount(0));
                    }}
                  >
                    {item.name}
                  </div>
                  {renderActionButtons(item)}
                </div>
              );
            }}
          </List>
        )}
      </AutoSizer>
    );
  };

  return (
    <div className="main-window">
      <div className="main-window">
        <FileDrop onDrop={onDrop}>
          <div
            className={"download-list-container"}
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderToolBar()}
            {data?.length ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "row",
                  overflow: "hidden",
                }}
              >
                {renderTaskList()}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Empty
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{
                    height: 120,
                  }}
                  description={
                    <span>
                      没有数据，请
                      <Button type={"link"} onClick={newDownload}>
                        新建下载
                      </Button>
                    </span>
                  }
                />
              </div>
            )}

            {/* 新建下载窗口 */}
            <Modal
              title="新建下载"
              open={isModalVisible}
              onCancel={handleCancel}
              footer={[
                <Button key="back" onClick={handleDownload}>
                  立即下载
                </Button>,
                <Button key="submit" onClick={handleCancel}>
                  取消
                </Button>,
                <Button key="link" type="primary" onClick={handleOk}>
                  添加
                </Button>,
              ]}
            >
              <Form
                labelCol={{ span: 4 }}
                form={formRef}
                initialValues={{ delete: true }}
              >
                <Form.Item
                  label="m3u8"
                  name="url"
                  rules={[{ required: true, message: "请填写 m3u8 链接" }]}
                >
                  <Input placeholder="[必填] 输入 m3u8 地址" allowClear />
                </Form.Item>
                <Form.Item
                  label="视频名称"
                  name="name"
                  rules={[{ required: true, message: "请填写视频名称" }]}
                >
                  <Input placeholder="[可空] 默认当前时间戳" allowClear />
                </Form.Item>
                <HeaderEdit label={"请求标头"} name={"headers"} />
                <Form.Item
                  label="下载完成是否删除"
                  name="delete"
                  labelCol={{ span: 8 }}
                  valuePropName="checked"
                  hidden={exeFile === "mediago"}
                >
                  <Switch />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </FileDrop>
      </div>
    </div>
  );
};

export default MainPage;
