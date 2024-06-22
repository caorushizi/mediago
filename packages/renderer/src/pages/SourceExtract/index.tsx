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
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import DownloadForm, { DownloadFormRef } from "../../components/DownloadForm";

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
    webviewUrlContextMenu,
    getAppStore: ipcGetAppStore,
    downloadNow,
    addDownloadItem,
  } = useElectron();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const [messageApi, contextHolder] = message.useMessage();
  const store = useSelector(selectBrowserStore);
  const appStore = useSelector(selectAppStore);
  const [modalShow, setModalShow] = useState(false);
  const [placeHolder, setPlaceHolder] = useState<string>("");
  const downloadForm = useRef<DownloadFormRef>(null);
  const originTitle = useRef(document.title);

  const curIsFavorite = useMemo(() => {
    return favoriteList.find((item) => item.url === store.url);
  }, [favoriteList, store.url]);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  const loadUrl = (url: string) => {
    dispatch(
      setBrowserStore({
        url,
        mode: PageMode.Browser,
        status: BrowserStatus.Loading,
      })
    );
    webviewLoadURL(url);
  };

  const goto = () => {
    const link = generateUrl(store.url);
    loadUrl(link);
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

  const onInputContextMenu = () => {
    webviewUrlContextMenu();
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
      document.title = originTitle.current;
      dispatch(setBrowserStore({ url: "", title: "", mode: PageMode.Default }));
    }
  };

  const onClickGoHome = async () => {
    await webviewGoHome();
    dispatch(
      setBrowserStore({
        url: "",
        title: "",
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

  const onClickLoadItem = (item: Favorite) => {
    loadUrl(item.url);
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

  // 设置当前的下载表单
  const setCurrentDownloadForm = async (data: DownloadItem) => {
    const { type, url, name, headers } = data;

    downloadForm.current.setFieldsValue({
      type,
      url,
      name,
      headers,
    });
  };

  const onShowDownloadDialog = async (
    e: unknown,
    data: DownloadItem[],
    image: string
  ) => {
    // FIXME: 选择
    setCurrentDownloadForm(data[data.length - 1]);

    setPlaceHolder(image);
    setModalShow(true);
  };

  const onChangePrivacy = () => {
    document.title = originTitle.current;
    dispatch(setBrowserStore({ url: "", title: "", mode: PageMode.Default }));
  };

  useEffect(() => {
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("webview-fail-load", onFailLoad);
    addIpcListener("webview-did-navigate", onDidNavigate);
    addIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
    addIpcListener("favorite-item-event", onFavoriteEvent);
    addIpcListener("show-download-dialog", onShowDownloadDialog);
    addIpcListener("change-privacy", onChangePrivacy);

    return () => {
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("webview-fail-load", onFailLoad);
      removeIpcListener("webview-did-navigate", onDidNavigate);
      removeIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
      removeIpcListener("favorite-item-event", onFavoriteEvent);
      removeIpcListener("show-download-dialog", onShowDownloadDialog);
      removeIpcListener("change-privacy", onChangePrivacy);
    };
  }, [store.status]);

  const setPageInfo = ({ url, title }: UrlDetail) => {
    document.title = title;
    dispatch(setBrowserStore({ url, title }));
  };

  const onDomReady = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  };

  const onFailLoad = (e: unknown, data: { code: number; desc: string }) => {
    dispatch(
      setBrowserStore({
        status: BrowserStatus.Failed,
        errCode: data.code,
        errMsg: data.desc,
      })
    );
  };

  const onDidNavigate = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
    dispatch(setBrowserStore({ status: BrowserStatus.Loaded }));
  };

  const onDidNavigateInPage = (e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  };

  useEffect(() => {
    document.title = store.title || document.title;
    return () => {
      document.title = originTitle.current;
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
        <Button
          type="text"
          title={t("switchToMobileMode")}
          onClick={onSetDefaultUA}
        >
          {appStore.isMobile ? <MobileFilled /> : <MobileOutlined />}
        </Button>
        <Button
          disabled={disabled}
          title={t("home")}
          type="text"
          onClick={onClickGoHome}
        >
          <HomeOutlined />
        </Button>
        <Button
          disabled={disabled}
          title={t("back")}
          type="text"
          onClick={onClickGoBack}
        >
          <ArrowLeftOutlined />
        </Button>
        {store.mode === PageMode.Browser &&
        store.status === BrowserStatus.Loading ? (
          <Button title={t("cancle")} type="text" onClick={onClickGoHome}>
            <CloseOutlined />
          </Button>
        ) : (
          <Button
            disabled={disabled}
            title={t("refresh")}
            type="text"
            onClick={goto}
          >
            <ReloadOutlined />
          </Button>
        )}
        <Button
          type="text"
          title={curIsFavorite ? t("cancelFavorite") : t("favorite")}
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
          onContextMenu={onInputContextMenu}
          placeholder={t("pleaseEnterUrl")}
        />
        <Button
          title={t("visit")}
          type="text"
          onClick={onClickEnter}
          disabled={!store.url}
        >
          <ArrowRightOutlined />
        </Button>
        {page && (
          <Button
            type="text"
            title={t("mergeToMainWindow")}
            onClick={onCombineToHome}
          >
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
    } else if (modalShow) {
      content = (
        <img
          src={placeHolder}
          alt=""
          style={{
            height: "100%",
            width: "100%",
          }}
        />
      );
    } else if (store.status === BrowserStatus.Failed) {
      content = (
        <Empty
          description={`${store.errMsg || t("loadFailed")} (${store.errCode})`}
        >
          <Space>
            <Button type="primary" onClick={onClickGoHome}>
              {t("backToHome")}
            </Button>
            <Button onClick={goto}>{t("refresh")}</Button>
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
          title={t("addShortcut")}
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
            label={t("siteName")}
            placeholder={t("pleaseEnterSiteName")}
            rules={[
              {
                required: true,
                message: t("pleaseEnterSiteName"),
              },
            ]}
          />
          <ProFormText
            name="url"
            label={t("siteUrl")}
            placeholder={t("pleaseEnterSiteUrl")}
            rules={[
              {
                required: true,
                message: t("pleaseEnterSiteUrl"),
              },
              {
                pattern: /^https?:\/\/.+/,
                message: t("pleaseEnterCorrectUrl"),
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
        <div className="list-tem-card" onClick={() => onClickLoadItem(item)}>
          <Button
            className="favorite-remove-btn"
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
          {item.icon ? (
            <Avatar shape="square" src={item.icon} icon={<LinkOutlined />} />
          ) : (
            <Avatar shape="square" icon={<LinkOutlined />} />
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

  const confirmDownload = async (now?: boolean) => {
    try {
      const data = downloadForm.current.getFieldsValue();

      if (now) {
        await downloadNow(data);
      } else {
        await addDownloadItem(data);
      }

      // 提交成功后关闭弹窗
      setModalShow(false);

      return true;
    } catch (e) {
      message.error((e as any).message);
      return false;
    }
  };

  // 渲染表单
  const renderModalForm = () => {
    return (
      <DownloadForm
        isEdit
        ref={downloadForm}
        open={modalShow}
        onOpenChange={setModalShow}
        onDownloadNow={() => confirmDownload(true)}
        onAddToList={() => confirmDownload()}
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
      {renderModalForm()}
    </PageContainer>
  );
};

export default SourceExtract;
