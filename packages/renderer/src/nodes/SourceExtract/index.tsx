import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  HomeOutlined,
  ImportOutlined,
  LinkOutlined,
  MobileFilled,
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useAsyncEffect, useRequest } from "ahooks";
import {
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  List,
  message,
  Space,
  Spin,
} from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { generateUrl, getFavIcon } from "../../utils";
import "./index.scss";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
import {
  BrowserStatus,
  PageMode,
  selectBrowserStore,
  setAppStore,
  setBrowserStore,
} from "../../store";
import WebView from "../../components/WebView";
import { selectAppStore } from "../../store";

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const {
    getFavorites,
    addFavorite,
    removeFavorite,
    webviewLoadURL,
    addIpcListener,
    removeIpcListener,
    webviewGoBack,
    webviewGoHome,
    onFavoriteItemContextMenu,
    combineToHomePage,
    getSharedState,
    setUserAgent,
    getAppStore: ipcGetAppStore,
  } = useElectron();
  const dispatch = useDispatch();
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const [messageApi, contextHolder] = message.useMessage();
  const [hoverId, setHoverId] = useState<number>(-1);
  const store = useSelector(selectBrowserStore);
  const appStore = useSelector(selectAppStore);

  const curIsFavorite = favoriteList.find((item) => item.url === store.url);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  const loadUrl = async (url: string) => {
    try {
      dispatch(
        setBrowserStore({
          mode: PageMode.Browser,
          status: BrowserStatus.Loading,
        })
      );
      await webviewLoadURL(url);
      dispatch(
        setBrowserStore({
          url: url,
          status: BrowserStatus.Loaded,
        })
      );
    } catch (err) {
      dispatch(
        setBrowserStore({
          status: BrowserStatus.Failed,
          errMsg: (err as any).message,
        })
      );
    }
  };

  const goto = async () => {
    const link = generateUrl(store.url);
    await loadUrl(link);
  };

  const onInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!store.url) {
      return;
    }
    if (e.key !== "Enter") {
      return;
    }

    await goto();
  };

  const onClickAddFavorite = async () => {
    if (curIsFavorite) {
      await removeFavorite(curIsFavorite.id);
    } else {
      const icon = await getFavIcon(store.url);
      await addFavorite({
        url: store.url,
        title: store.title || store.url,
        icon,
      });
    }
    refresh();
  };

  const onClickGoBack = async () => {
    const back = await webviewGoBack();

    if (!back) {
      dispatch(
        setBrowserStore({
          url: "",
          mode: PageMode.Default,
        })
      );
    }
  };

  const onClickGoHome = async () => {
    await webviewGoHome();
    dispatch(
      setBrowserStore({
        url: "",
        mode: PageMode.Default,
      })
    );
  };

  const onClickEnter = async () => {
    if (!store.url) {
      return;
    }

    await goto();
  };

  const onClickLoadItem = async (item: Favorite) => {
    await loadUrl(item.url);
  };

  const onDomReady = (e: unknown, data: UrlDetail) => {
    if (data.url) {
      document.title = data.title;
      dispatch(
        setBrowserStore({
          url: data.url,
          title: data.title,
        })
      );
    }
  };

  const onFavoriteEvent = async (
    e: unknown,
    {
      action,
      payload,
    }: {
      action: string;
      payload: number;
    }
  ) => {
    if (action === "open") {
      const item = favoriteList.find((item) => item.id === payload);
      if (item) {
        onClickLoadItem(item);
      }
    } else if (action === "delete") {
      await removeFavorite(payload);
      refresh();
    }
  };

  useAsyncEffect(async () => {
    const state = await getSharedState();
    dispatch(setBrowserStore(state));
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("favorite-item-event", onFavoriteEvent);

    return () => {
      document.title = prevTitle;
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("favorite-item-event", onFavoriteEvent);
    };
  }, []);

  // 合并到主页
  const onCombineToHome = () => {
    combineToHomePage(store);
  };

  // 设置默认UA
  const onSetDefaultUA = () => {
    const nextMode = !appStore.isMobile;
    setUserAgent(nextMode);
    dispatch(
      setAppStore({
        isMobile: nextMode,
      })
    );
  };

  // 渲染工具栏
  const renderToolbar = () => {
    const disabled =
      store.status !== BrowserStatus.Loaded || store.mode !== PageMode.Browser;
    return (
      <Space.Compact className="action-bar" block>
        <Button type="text" title="切换为手机模式" onClick={onSetDefaultUA}>
          {appStore.isMobile ? <MobileFilled /> : <MobileOutlined />}
        </Button>
        <Button
          disabled={disabled}
          title="首页"
          type="text"
          onClick={onClickGoHome}
        >
          <HomeOutlined />
        </Button>
        <Button
          disabled={disabled}
          title="回退"
          type="text"
          onClick={onClickGoBack}
        >
          <ArrowLeftOutlined />
        </Button>
        <Button disabled={disabled} title="刷新" type="text" onClick={goto}>
          <ReloadOutlined />
        </Button>
        <Button
          type="text"
          title={curIsFavorite ? "取消收藏" : "收藏"}
          onClick={onClickAddFavorite}
          disabled={disabled}
        >
          {curIsFavorite ? <StarFilled /> : <StarOutlined />}
        </Button>
        <Input
          key="url-input"
          value={store.url}
          onChange={(e) => {
            const url = e.target.value;
            dispatch(setBrowserStore({ url }));
          }}
          onFocus={(e) => {
            e.target.select();
          }}
          onKeyDown={onInputKeyDown}
          placeholder="请输入网址"
        />
        <Button
          title="访问"
          type="text"
          onClick={onClickEnter}
          disabled={!store.url}
        >
          <ArrowRightOutlined />
        </Button>
        {page && (
          <Button type="text" title="合并到主窗口" onClick={onCombineToHome}>
            <ImportOutlined />
          </Button>
        )}
      </Space.Compact>
    );
  };

  // 渲染浏览器面板
  const renderBrowserPanel = () => {
    let content = <div></div>;
    if (store.status === BrowserStatus.Loading) {
      content = <Spin />;
    } else if (store.status === BrowserStatus.Failed) {
      content = (
        <Empty description={store.errMsg || "加载失败"}>
          <Space>
            <Button type="primary" onClick={onClickGoHome}>
              返回首页
            </Button>
            <Button onClick={goto}>刷新</Button>
          </Space>
        </Empty>
      );
    } else if (store.status === BrowserStatus.Loaded) {
      content = <WebView className="webview-inner" />;
    }
    return <div className="webview-container">{content}</div>;
  };

  // 渲染收藏 item
  const renderFavoriteItem = (item: Favorite | "add") => {
    if (item === "add") {
      return (
        <ModalForm<Favorite>
          title="添加快捷方式"
          width={500}
          trigger={
            <List.Item className="list-item">
              <div className="list-tem-card">
                <PlusOutlined style={{ fontSize: "20px" }} />
              </div>
            </List.Item>
          }
          form={favoriteAddForm}
          autoFocusFirstInput
          modalProps={{
            destroyOnClose: true,
            styles: {
              body: {
                paddingTop: 5,
              },
            },
          }}
          submitTimeout={2000}
          layout="horizontal"
          onFinish={async (values) => {
            try {
              const icon = await getFavIcon(values.url);
              await addFavorite({
                url: values.url,
                title: values.title,
                icon,
              });
              favoriteAddForm.resetFields();
              refresh();
              return true;
            } catch (err: any) {
              messageApi.error(err.message);
            }
          }}
        >
          <ProFormText
            name="title"
            label="站点名称"
            placeholder="请输入站点名称"
            rules={[
              {
                required: true,
                message: "请输入站点名称",
              },
            ]}
          />
          <ProFormText
            name="url"
            label="站点网址"
            placeholder="请输入站点网址"
            rules={[
              {
                required: true,
                message: "请输入站点网址",
              },
              {
                pattern: /^https?:\/\/.+/,
                message: "请输入正确的网址",
              },
            ]}
          />
        </ModalForm>
      );
    }

    return (
      <List.Item
        className="list-item"
        onContextMenu={() => {
          onFavoriteItemContextMenu(item.id);
        }}
      >
        <div
          className="list-tem-card"
          onClick={() => onClickLoadItem(item)}
          onMouseLeave={() => {
            setHoverId(-1);
          }}
          onMouseOver={() => {
            setHoverId(item.id);
          }}
        >
          {hoverId === item.id && (
            <Button
              style={{
                position: "absolute",
                right: -1,
                top: 2,
                color: "gray",
              }}
              type="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFavorite(item.id);
                refresh();
              }}
            >
              <CloseOutlined />
            </Button>
          )}
          {item.icon ? (
            <Avatar src={item.icon} icon={<LinkOutlined />} />
          ) : (
            <Avatar icon={<LinkOutlined />} />
          )}
          <div className="card-text" title={item.title}>
            {item.title}
          </div>
        </div>
      </List.Item>
    );
  };

  const renderFavoriteList = () => {
    return (
      <List<Favorite | "add">
        grid={{ gutter: 16, lg: 5, xl: 7, xxl: 7 }}
        className="list-container"
        itemLayout="vertical"
        dataSource={[...favoriteList, "add"]}
        renderItem={renderFavoriteItem}
      />
    );
  };

  return (
    <PageContainer
      className={"source-extract"}
      extraClassName={page ? "is-page" : ""}
    >
      {contextHolder}
      {renderToolbar()}
      <div className="source-extract-content">
        {store.mode === PageMode.Browser
          ? renderBrowserPanel()
          : renderFavoriteList()}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
