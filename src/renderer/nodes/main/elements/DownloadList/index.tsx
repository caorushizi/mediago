import React, {
  ComponentType,
  DragEvent as ReactDragEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Resizable } from "re-resizable";
import "./index.scss";
import { Box } from "@chakra-ui/react";
import {
  Fav,
  M3u8DLArgs,
  MediaGoArgs,
  SourceItem,
  SourceItemForm,
} from "types/common";
import { SourceStatus, SourceType } from "renderer/types";
import classNames from "classnames";
import {
  Button,
  Dropdown,
  Form,
  FormInstance,
  Input,
  Menu,
  Modal,
  Space,
  Switch,
  Tooltip,
} from "antd";
import onEvent from "renderer/utils/td-utils";
import {
  AppstoreAddOutlined,
  BlockOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { helpUrl } from "renderer/utils/variables";
import { processHeaders } from "renderer/utils/utils";
import {
  getFavs,
  insertFav,
  insertVideo,
  removeFav,
  updateVideoStatus,
  updateVideoTitle,
  updateVideoUrl,
} from "renderer/utils/localforge";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-form";
import { isUrl } from "renderer/utils";
import { useSelector } from "react-redux";
import { Settings } from "renderer/store/models/settings";
import { AppState } from "renderer/store/reducers";
import { FileDrop } from "react-file-drop";
import ProForm from "@ant-design/pro-form";

type ActionButton = {
  key: string;
  text: string | ReactNode;
  tooltip?: string;
  title?: string;
  showTooltip?: boolean;
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

// if (currentSourceItem) {
//   if (key === "title") {
//     await updateVideoTitle(currentSourceItem, row.title);
//   } else if (key === "url") {
//     await updateVideoUrl(currentSourceItem, row.url);
//   }
//   await updateTableData();
//   setCurrentSourceItem(row);
// }

const headersPlaceholder = `[可空] 请输入一行一个Header，例如：
Origin: https://www.sample.com
Referer: https://www.sample.com`;

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
  changeSourceStatus,
  workspace,
  updateTableData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [favsList, setFavsList] = useState<Fav[]>([]);
  const [maxWidth, setMaxWidth] = useState<number>(winWidth);
  const [currentSourceItem, setCurrentSourceItem] = useState<SourceItem>();
  const settings = useSelector<AppState, Settings>((state) => state.settings);
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

    return () => {
      window.removeEventListener("resize", calcMaxWidth);
    };
  }, []);

  const initData = async () => {
    const favs = await getFavs();
    setFavsList(favs);
  };

  // 表单数据预处理
  const preProcessFormData = (data: SourceItem) => {
    const formatter = (key: string, value: any) => {
      switch (key) {
        // case "headers":
        //   return Object.entries(value)
        //     .map(([key, value]) => `${key}:${value}`)
        //     .join("\n");
        default:
          return value;
      }
    };

    const result: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      result[key] = formatter(key, data[key as keyof SourceItem]);
    });
    return result;
  };

  // 表单数据后处理
  const postProcessFormData = () => {};

  // 渲染视频下载的状态
  const renderStatus = (item: SourceItem) => {
    const status = item.status;
    return (
      <Tooltip title={titleMap[status]} placement={"right"}>
        <Box h={8} w={8} borderRadius={4} mr={8} bg={colorMap[status]} />
      </Tooltip>
    );
  };

  // 渲染item
  const renderItem: ComponentType<ListChildComponentProps<SourceItem>> = ({
    index,
    style,
  }) => {
    const item = tableData[index];

    return (
      <Box
        className={classNames("list-item")}
        style={style}
        title={item.title}
        display={"flex"}
        flexDirection={"row"}
        alignItems={"center"}
        px={15}
      >
        {renderStatus(item)}
        <Box
          flex={1}
          className={"list-item-inner"}
          onClick={() => {
            setCurrentSourceItem(item);
            detailForm.setFieldsValue(preProcessFormData(item));
            calcMaxWidth();
          }}
        >
          {item.title}
        </Box>
        {renderActionButtons(item)}
      </Box>
    );
  };

  // 点击取消新建下载
  const handleCancel = (): void => {
    setIsModalVisible(false);
  };

  // 向列表中插入一条数据并且请求详情
  const insertUpdateTableData = async (
    item: SourceItemForm
  ): Promise<SourceItem> => {
    const { workspace } = settings;
    const sourceItem: SourceItem = {
      status: SourceStatus.Ready,
      type: SourceType.M3u8,
      directory: workspace,
      title: item.title,
      duration: 0,
      url: item.url,
      createdAt: Date.now(),
      deleteSegments: item.delete,
    };
    if (item.headers) {
      sourceItem.headers = processHeaders(item.headers);
    }
    await insertVideo(sourceItem);
    await updateTableData();
    setIsModalVisible(false);
    return sourceItem;
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
          await insertFav(fav);
          const favs = await getFavs();
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
    await changeSourceStatus(item, SourceStatus.Downloading);
    onEvent.tableStartDownload();
    const exeFile = await window.electron.store.get("exeFile");
    const workspace = await window.electron.store.get("workspace");
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
        enableDelAfterDone: item.deleteSegments,
      };
    }

    const { code, msg } = await window.electron.ipcExec(exeFile, args);
    if (code === 0) {
      await changeSourceStatus(item, SourceStatus.Success);
      onEvent.mainPageDownloadSuccess({ msg, url, exeFile });
    } else {
      await changeSourceStatus(item, SourceStatus.Failed);
      onEvent.mainPageDownloadFail({ msg, url, exeFile });
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
        await removeFav(fav);
        const favs = await getFavs();
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
            <Box
              d={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
              width={"100%"}
            >
              <Box
                flex={1}
                overflow={"hidden"}
                whiteSpace={"nowrap"}
                textOverflow={"ellipsis"}
                onClick={() => {
                  onEvent.favPageOpenLink();
                  window.electron.openBrowserWindow(fav.url);
                }}
                title={fav.title}
              >
                {fav.title}
              </Box>
              <Button type="link" danger onClick={() => handleDelete(fav)}>
                删除
              </Button>
            </Box>
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item key="add">{renderAddFav()}</Menu.Item>
      </Menu>
    );
  };

  // 渲染页面上方的按钮
  const renderToolBar = () => {
    return (
      <Box p={10}>
        <Space>
          <Button
            key={"1"}
            onClick={() => {
              onEvent.mainPageNewSource();
              setIsModalVisible(true);
            }}
          >
            <AppstoreAddOutlined />
            新建下载
          </Button>
          <Dropdown.Button
            key={"2"}
            trigger={["click"]}
            onClick={() => {
              onEvent.mainPageOpenBrowserPage();
              window.electron.openBrowserWindow();
            }}
            overlay={browserMenu}
          >
            <BlockOutlined />
            打开浏览器
          </Dropdown.Button>
          <Button
            key={"4"}
            onClick={async () => {
              onEvent.mainPageHelp();
              window.electron.openExternal(helpUrl);
            }}
          >
            <QuestionCircleOutlined />
            使用帮助
          </Button>
        </Space>
      </Box>
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
      case SourceStatus.Success:
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
          cb: () => downloadFile(row),
        });
        break;
      case SourceStatus.Failed:
        // 下载失败
        buttons.push({
          key: "3",
          text: (
            <Button type={"link"} size={"small"}>
              重新下载
            </Button>
          ),
          title: "重新下载",
          cb: () => downloadFile(row),
        });
        break;
      case SourceStatus.Downloading:
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
            await updateVideoStatus(row, SourceStatus.Ready);
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
          cb: () => downloadFile(row),
        });
        break;
    }
    return (
      <Box display={"flex"}>
        {buttons.map((button) =>
          button.showTooltip ? (
            <Tooltip title={button.tooltip}>
              <Box
                pl={10}
                key={button.key}
                onClick={button.cb}
                title={button.title}
              >
                {button.text}
              </Box>
            </Tooltip>
          ) : (
            <Box
              pl={10}
              key={button.key}
              onClick={button.cb}
              title={button.title}
            >
              {button.text}
            </Box>
          )
        )}
      </Box>
    );
  };

  // 文件放入事件
  const onDrop = async (
    files: FileList | null,
    event: ReactDragEvent<HTMLDivElement>
  ) => {
    console.log(files, event);
    if (files?.length === 1) {
      // 只有一个文件被拽入
      await setIsModalVisible(true);
      const [file] = files;
      formRef?.setFieldsValue({ url: file.path });
    }
  };

  return (
    <FileDrop onDrop={onDrop}>
      <Box h={"100%"} w={"100%"} display={"flex"} flexDirection={"column"}>
        {renderToolBar()}
        <Box
          flex={1}
          display={"flex"}
          overflow={"hidden"}
          flexDirection={"row"}
        >
          <Resizable
            as={Box}
            enable={{ right: true }}
            minHeight={"100%"}
            minWidth={currentSourceItem ? "350px" : "100%"}
            maxWidth={currentSourceItem ? maxWidth : "100%"}
          >
            <AutoSizer className={"new-download-list"}>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={tableData.length}
                  itemSize={35}
                  width={width}
                >
                  {renderItem}
                </List>
              )}
            </AutoSizer>
          </Resizable>

          {currentSourceItem && (
            <Box
              p={15}
              height={"100%"}
              flex={1}
              overflowY={"scroll"}
              minW={"300px"}
            >
              <ProForm
                form={detailForm}
                size={"small"}
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
              >
                <ProForm.Group>
                  <ProFormText
                    name={"title"}
                    label="视频名称"
                    placeholder="请输入视频名称"
                  />
                  <ProFormText
                    name={"url"}
                    label="请求地址"
                    placeholder="请输入请求地址"
                  />
                </ProForm.Group>
                <ProForm.Group>
                  <ProFormText
                    name={"workspace"}
                    label="本地路径"
                    placeholder="请输入本地路径"
                  />
                  <ProFormText
                    name={"exeFile"}
                    label="执行程序"
                    placeholder="请选择可执行程序"
                  />
                </ProForm.Group>
                <ProFormTextArea label={"请求标头"} name={"headers"} />
              </ProForm>
            </Box>
          )}
        </Box>

        {/*新建下载窗口*/}
        <Modal
          title="新建下载"
          visible={isModalVisible}
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
              <Input placeholder="[必填] 输入 m3u8 地址，或将M3U8文件拖拽至此" />
            </Form.Item>
            <Form.Item
              label="视频名称"
              name="title"
              rules={[{ required: true, message: "请填写视频名称" }]}
            >
              <Input placeholder="[可空] 默认当前时间戳" />
            </Form.Item>
            <Form.Item label="请求标头" name="headers">
              <Input.TextArea rows={3} placeholder={headersPlaceholder} />
            </Form.Item>
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
      </Box>
    </FileDrop>
  );
};

export default DownloadList;
