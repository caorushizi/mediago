import React, { ComponentType, ReactNode, useState } from "react";
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
import { Button, Dropdown, Menu, Modal, Space, Tooltip } from "antd";
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
import NewSourceForm from "renderer/nodes/main/elements/DownloadList/NewSourceForm";
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
import { ModalForm, ProFormText } from "@ant-design/pro-form";
import { isUrl } from "renderer/utils";
import { useSelector } from "react-redux";
import { Settings } from "renderer/store/models/settings";
import { AppState } from "renderer/store/reducers";

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

// 待下载列表页
const DownloadList: React.FC<Props> = ({
  tableData,
  changeSourceStatus,
  workspace,
  updateTableData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [favsList, setFavsList] = useState<Fav[]>([]);
  const [currentSourceItem, setCurrentSourceItem] = useState<SourceItem>();
  const settings = useSelector<AppState, Settings>((state) => state.settings);

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
        px={15}
      >
        <Box
          flex={1}
          className={"list-item-inner"}
          onClick={() => {
            setCurrentSourceItem(item);
          }}
        >
          {item.title}
        </Box>
        <Box display={"flex"}>{renderActionButtons(item)}</Box>
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
          <Button type="primary" size={"small"} icon={<PlusOutlined />}>
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
  const handleOk = async (item: SourceItemForm): Promise<void> => {
    onEvent.addSourceAddSource();
    await insertUpdateTableData(item);
  };

  // 新建下载窗口点击立即下载
  const handleDownload = async (item: SourceItemForm): Promise<void> => {
    onEvent.addSourceDownload();
    const sourceItem = await insertUpdateTableData(item);
    await downloadFile(sourceItem);
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
    console.log(123123123123, favsList);
    return (
      <Menu>
        {favsList.map((fav, i) => (
          <Menu.Item key={i}>
            <div className="fav-item">
              <div
                className="fav-item__inner"
                onClick={() => {
                  onEvent.favPageOpenLink();
                  window.electron.openBrowserWindow(fav.url);
                }}
              >
                {fav.title}
              </div>
              <Button type="link" danger onClick={() => handleDelete(fav)}>
                删除
              </Button>
            </div>
          </Menu.Item>
        ))}
        <Menu.Item key="xxx">{renderAddFav()}</Menu.Item>
      </Menu>
    );
  };

  // 渲染页面上方的按钮
  const renderToolBar = () => {
    return (
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
          text: <FolderOpenOutlined />,
          title: "打开文件位置",
          cb: openDirectory,
        });
        buttons.push({
          key: "2",
          text: <ReloadOutlined />,
          title: "重新下载",
          cb: () => downloadFile(row),
        });
        break;
      case SourceStatus.Failed:
        // 下载失败
        buttons.push({
          key: "3",
          text: <ReloadOutlined />,
          title: "重新下载",
          cb: () => downloadFile(row),
        });
        break;
      case SourceStatus.Downloading:
        // 正在下载
        buttons.push({
          key: "5",
          text: "重置状态",
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
          text: <DownloadOutlined />,
          title: "下载",
          cb: () => downloadFile(row),
        });
        break;
    }
    return buttons.map((button) =>
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
        <Box pl={10} key={button.key} onClick={button.cb} title={button.title}>
          {button.text}
        </Box>
      )
    );
  };

  return (
    <Box h={"100%"} w={"100%"} display={"flex"} flexDirection={"column"}>
      <Box p={5}>{renderToolBar()}</Box>
      <Box flex={1} display={"flex"} overflow={"hidden"} flexDirection={"row"}>
        <Resizable
          as={Box}
          enable={{ right: true }}
          minHeight={"100%"}
          minWidth={currentSourceItem ? "350px" : "100%"}
          maxWidth={"100%"}
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
          <Box p={15} height={"100%"} flex={1} overflowY={"hidden"}>
            123123123123
          </Box>
        )}
      </Box>

      {/*新建下载窗口*/}
      <NewSourceForm
        visible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        handleDownload={handleDownload}
      />
    </Box>
  );
};

export default DownloadList;
