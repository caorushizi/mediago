import React, {
  DragEvent as ReactDragEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import "./index.scss";
import classNames from "classnames";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Row,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { downloaderOptions, isUrl, onEvent } from "../../../../utils";
import {
  AppstoreAddOutlined,
  BlockOutlined,
  CloseOutlined,
  DownOutlined,
  PlusOutlined,
  UpOutlined,
} from "@ant-design/icons";
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../../../store/reducers";
import { FileDrop } from "react-file-drop";
import useElectron from "../../../../hooks/electron";
import { Settings } from "../../../../store/actions/settings.actions";
import { updateNotifyCount } from "../../../../store/actions/main.actions";
import HeaderEdit from "../../../../components/HeaderEdit";
import { VideoStatus } from "../../../../types";

interface ActionButton {
  key: string;
  text: string | ReactNode;
  tooltip?: string;
  title?: string;
  showTooltip?: boolean;
  cb: () => void;
}

interface Props {
  tableData: SourceItem[];
  changeVideoStatus: (source: SourceItem, status: VideoStatus) => Promise<void>;
  workspace: string;
  updateTableData: () => Promise<void>;
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

const winWidth = document.documentElement.clientWidth;

// 待下载列表页
const DownloadList: React.FC<Props> = ({
  tableData,
  changeVideoStatus,
  workspace,
  updateTableData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [favsList, setFavsList] = useState<Fav[]>([]);
  const [, setMaxWidth] = useState<number>(winWidth);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [moreOptions, setMoreOptions] = useState<boolean>(false); // todo: 初始化判断mediago
  const [currentSourceItem, setCurrentSourceItem] =
    useState<SourceItem | null>();
  const settings = useSelector<AppState, Settings>((state) => state.settings);
  const dispatch = useDispatch();
  const tableDataRef = useRef<SourceItem[]>([]);
  tableDataRef.current = tableData;
  const { itemContextMenu, addEventListener, removeEventListener, ipcExec } =
    useElectron();
  const { exeFile } = settings;
  const [formRef] = Form.useForm();
  const [detailForm] = Form.useForm();

  const calcMaxWidth = useCallback(() => {
    const max = document.documentElement.clientWidth - 300;
    setMaxWidth(max);
  }, []);

  useEffect(() => {
    initData();

    window.addEventListener("resize", calcMaxWidth);
    addEventListener("download-context-menu-detail", contextMenuDetail);
    addEventListener("download-context-menu-download", contextMenuDownload);
    addEventListener("download-context-menu-delete", contextMenuDelete);
    addEventListener("download-context-menu-clear-all", contextMenuClearAll);

    return () => {
      window.removeEventListener("resize", calcMaxWidth);
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

  const contextMenuDetail = (
    e: Electron.IpcRendererEvent,
    item: SourceItem
  ) => {
    setCurrentSourceItem(item);
    detailForm.setFieldsValue(item);
    calcMaxWidth();
  };
  const contextMenuDownload = (
    e: Electron.IpcRendererEvent,
    item: SourceItem
  ) => {
    downloadFile(item);
  };
  const contextMenuDelete = async (
    event: Electron.IpcRendererEvent,
    item: SourceItem
  ) => {
    await window.electron.removeVideo(item.id);
    await updateTableData();
  };
  const contextMenuClearAll = async () => {
    await window.electron.removeVideo();
    await updateTableData();
  };

  const initData = async () => {
    const favs = await window.electron.getCollectionList();
    setFavsList(favs);
  };

  // 渲染视频下载的状态
  const renderStatus = (item: SourceItem) => {
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
  const newDownload = () => {
    onEvent.mainPageNewSource();
    setIsModalVisible(true);
  };

  // 打开浏览器
  const openBrowser = () => {
    onEvent.mainPageOpenBrowserPage();
    window.electron.openBrowserWindow();
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

  // 渲染添加按钮
  const renderAddFav = () => {
    return (
      <ModalForm<Fav>
        width={500}
        layout="horizontal"
        title="添加收藏"
        trigger={
          <Button
            type="link"
            style={{ padding: 0 }}
            size={"small"}
            icon={<PlusOutlined />}
          >
            添加收藏
          </Button>
        }
        onFinish={async (fav) => {
          onEvent.favPageAddFav();
          await window.electron.addCollection(fav);
          const favs = await window.electron.getCollectionList();
          setFavsList(favs);
          return true;
        }}
      >
        <ProFormText
          required
          name="title"
          label="链接名称"
          placeholder="请输入链接名称"
          rules={[{ required: true, message: "请输入链接名称" }]}
        />
        <ProFormText
          required
          name="url"
          label="链接地址"
          placeholder="请输入链接地址"
          rules={[
            { required: true, message: "请输入链接地址" },
            {
              validator(rule, value: string, callback) {
                if (!isUrl(value)) callback("请输入正确的 url 格式");
                else callback();
              },
            },
          ]}
        />
      </ModalForm>
    );
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

  // 删除收藏
  const handleDelete = async (fav: Fav): Promise<void> => {
    Modal.confirm({
      title: "确认要删除这个收藏吗？",
      onOk: async () => {
        onEvent.favPageDeleteLink();
        await window.electron.removeCollection(fav.id);
        const favs = await window.electron.getCollectionList();
        setFavsList(favs);
      },
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
    });
  };

  const browserMenu = () => {
    return (
      <Menu className={"favorite-menu"} style={{ width: 250 }}>
        {favsList.map((fav, i) => (
          <Menu.Item key={i} style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
                onClick={() => {
                  onEvent.favPageOpenLink();
                  window.electron.openBrowserWindow(fav.url);
                }}
                title={fav.title}
              >
                {fav.title}
              </div>
              <Button
                type="link"
                danger
                onClick={async () => await handleDelete(fav)}
              >
                删除
              </Button>
            </div>
          </Menu.Item>
        ))}
        {favsList.length > 0 && <Menu.Divider />}
        <Menu.Item key="add">{renderAddFav()}</Menu.Item>
      </Menu>
    );
  };

  // 渲染页面上方的按钮
  const renderToolBar = () => {
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
          <Dropdown.Button
            size={"middle"}
            key={"2"}
            trigger={["click"]}
            onClick={openBrowser}
            overlay={browserMenu}
            icon={<BlockOutlined />}
          >
            打开浏览器
          </Dropdown.Button>
        </Space>
      </div>
    );
  };

  // 打开所在文件夹
  const openDirectory = () => {
    window.electron.openPath(workspace);
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

  const renderTaskPanel = () => {
    return (
      <div className={"task-panel-wrapper"}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyItems: "flex-end",
            height: "40px",
          }}
        >
          <Button
            size={"small"}
            icon={<CloseOutlined />}
            type={"link"}
            onClick={() => {
              setCurrentSourceItem(null);
            }}
          />
        </div>
        <ProForm
          form={detailForm}
          layout={"horizontal"}
          submitter={{
            searchConfig: {
              resetText: "重置",
              submitText: "下载",
            },
            resetButtonProps: {
              style: {
                // 隐藏重置按钮
                display: "none",
              },
            },
            onSubmit: async () => {
              const item = detailForm.getFieldsValue();
              await downloadFile(item);
            },
          }}
          onValuesChange={(changedFields) => {
            if (changedFields.hasOwnProperty("exeFile")) {
              setMoreOptions(changedFields.exeFile !== "mediago");
            }
          }}
          size={"small"}
        >
          <ProFormText
            name={"name"}
            label="视频名称"
            placeholder="请输入视频名称"
          />
          <ProFormSelect
            name={"exeFile"}
            options={downloaderOptions}
            label={"下载程序"}
            placeholder={"请选择下载程序"}
          />
          <ProFormText
            name={"url"}
            label="请求地址"
            placeholder="请输入请求地址"
          />
          <HeaderEdit label={"请求标头"} name={"headers"} />
          {moreOptions && (
            <>
              <Divider plain style={{ margin: "-10px 0 5px 0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyItems: "flex-end",
                    cursor: "pointer",
                  }}
                  color={"#409EFF"}
                  onClick={() => {
                    setExpanded((state) => !state);
                  }}
                >
                  {expanded ? (
                    <>
                      <DownOutlined />
                      <div style={{ marginLeft: "5px" }}>展开更多高级选项</div>
                    </>
                  ) : (
                    <>
                      <UpOutlined />
                      <div style={{ marginLeft: "5px" }}>收起</div>
                    </>
                  )}
                </div>
              </Divider>
              {!expanded && (
                <>
                  <Form.Item
                    name={"checkbox"}
                    initialValue={["enableDelAfterDone"]}
                  >
                    <Checkbox.Group style={{ width: "100%" }}>
                      <Row>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="enableDelAfterDone">
                            合并后删除分片
                          </Checkbox>
                        </Col>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="disableDateInfo">
                            不写入日期
                          </Checkbox>
                        </Col>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="noProxy">不使用系统代理</Checkbox>
                        </Col>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="enableParseOnly">
                            仅解析m3u8
                          </Checkbox>
                        </Col>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="enableMuxFastStart">
                            混流MP4
                          </Checkbox>
                        </Col>
                        <Col span={12} style={{ marginBottom: "8px" }}>
                          <Checkbox value="noMerge">下载完不合并</Checkbox>
                        </Col>
                        <Col span={12}>
                          <Checkbox value="enableBinaryMerge">
                            使用二进制合并
                          </Checkbox>
                        </Col>
                        <Col span={12}>
                          <Checkbox value="enableAudioOnly">
                            仅合并音频轨道
                          </Checkbox>
                        </Col>
                        <Col span={12}>
                          <Checkbox value="disableIntegrityCheck">
                            关闭完整性检查
                          </Checkbox>
                        </Col>
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                  <Row>
                    <Col span={12}>
                      <Form.Item
                        name={"maxThreads"}
                        label={"最大线程"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={32}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={"minThreads"}
                        label={"最小线程"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={16}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={"retryCount"}
                        label={"重试次数"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={15}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={"timeOut"}
                        label={"超时时长(s)"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={10}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={"stopSpeed"}
                        label={"停速(KB/s)"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={0}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={"maxSpeed"}
                        label={"限速(KB/s)"}
                        labelCol={{ style: { width: "86px" } }}
                        labelAlign={"left"}
                        initialValue={0}
                      >
                        <InputNumber placeholder="placeholder" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </ProForm>
      </div>
    );
  };

  const renderTaskList = () => {
    return (
      <AutoSizer className={"new-download-list"}>
        {({ height, width }) => (
          <List<SourceItem[]>
            height={height}
            itemSize={35}
            width={width}
            itemData={tableDataRef.current}
            itemCount={tableDataRef.current.length}
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
                      setCurrentSourceItem(item);
                      detailForm.setFieldsValue({ ...item, exeFile });
                      calcMaxWidth();
                      setMoreOptions(exeFile !== "mediago");
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
        {tableData.length > 0 ? (
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
                  <br />
                  或者
                  <Button type={"link"} onClick={openBrowser}>
                    打开浏览器
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
  );
};

export default DownloadList;
