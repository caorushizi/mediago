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
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { generateUrl, getFavIcon } from "../../utils";
import "./index.scss";
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-components";
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
import { nanoid } from "nanoid";
import localforage from "localforage";
import { DownloadType } from "../../types";

interface SourceExtractProps {
  page?: boolean;
}

// 下载表单
interface DownloadForm {
  teleplay: boolean;
  type: DownloadType;
  name: string;
  url: string;
  numberOfEpisodes: number;
}

// 集数
interface NumberOfEpisodes {
  teleplay: boolean;
  numberOfEpisodes: number;
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
  const [hoverId, setHoverId] = useState<number>(-1);
  const store = useSelector(selectBrowserStore);
  const appStore = useSelector(selectAppStore);
  const [form] = Form.useForm<DownloadForm>();
  const [modalShow, setModalShow] = useState(false);
  const [modalReadyShow, setModalReadyShow] = useState(false);
  const sessionId = useRef("");

  const curIsFavorite = favoriteList.find((item) => item.url === store.url);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  const loadUrl = async (url: string) => {
    const id = nanoid();
    sessionId.current = id;
    try {
      dispatch(
        setBrowserStore({
          url: "",
          mode: PageMode.Browser,
          status: BrowserStatus.Loading,
        }),
      );
      await webviewLoadURL(url);
      if (sessionId.current === id) {
        dispatch(
          setBrowserStore({
            url: url,
            status: BrowserStatus.Loaded,
          }),
        );
      }
    } catch (err) {
      if (sessionId.current === id) {
        dispatch(
          setBrowserStore({
            status: BrowserStatus.Failed,
            errMsg: (err as any).message,
          }),
        );
      }
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
      dispatch(
        setBrowserStore({
          url: "",
          mode: PageMode.Default,
        }),
      );
    }
  };

  const onClickGoHome = async () => {
    await webviewGoHome();
    dispatch(
      setBrowserStore({
        url: "",
        mode: PageMode.Default,
      }),
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
        }),
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
    },
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

  const onShowDownloadDialog = async (e: any, data: DownloadForm) => {
    const noe = await localforage.getItem<NumberOfEpisodes>("numberOfEpisodes");
    form.setFieldsValue({
      type: data.type,
      url: data.url,
      name: data.name,
      teleplay: noe?.teleplay || false,
      numberOfEpisodes: noe?.numberOfEpisodes || 1,
    });
    setModalShow(true);
  };

  useEffect(() => {
    const prevTitle = document.title;
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("favorite-item-event", onFavoriteEvent);
    addIpcListener("show-download-dialog", onShowDownloadDialog);

    return () => {
      document.title = prevTitle;
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("favorite-item-event", onFavoriteEvent);
      removeIpcListener("show-download-dialog", onShowDownloadDialog);
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
      }),
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
    } else if (modalReadyShow || modalShow) {
      content = <></>;
    } else if (store.status === BrowserStatus.Failed) {
      content = (
        <Empty description={store.errMsg || t("loadFailed")}>
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

  const confirmDownload = async (now?: boolean) => {
    try {
      const data = form.getFieldsValue();
      const { numberOfEpisodes, teleplay, ...item } = data;

      if (teleplay) {
        await localforage.setItem<NumberOfEpisodes>("numberOfEpisodes", {
          numberOfEpisodes,
          teleplay,
        });
      }

      if (teleplay) {
        item.name = `${item.name} - 第${numberOfEpisodes}集`;
      }

      if (now) {
        await downloadNow(item);
      } else {
        await addDownloadItem(item);
      }

      // 提交成功后关闭弹窗
      setModalShow(false);
    } catch (e) {
      message.error((e as any).message);
    }
  };

  // 渲染表单
  const renderModalForm = () => {
    return (
      <ModalForm<DownloadForm>
        open={modalShow}
        title={t("newDownload")}
        onOpenChange={setModalShow}
        form={form}
        modalProps={{
          destroyOnClose: true,
          afterOpenChange: setModalReadyShow,
          okText: t("downloadNow"),
          styles: {
            body: {
              paddingTop: 5,
            },
          },
        }}
        submitter={{
          render: (props, [, okButton]) => {
            return [
              <Button
                key="addToList"
                onClick={async () => {
                  await confirmDownload();
                }}
              >
                {t("addToDownloadList")}
              </Button>,
              okButton,
            ];
          },
        }}
        submitTimeout={2000}
        onFinish={async () => {
          await confirmDownload(true);
          return true;
        }}
        labelCol={{ style: { width: "120px" } }}
        layout="horizontal"
        width={550}
        labelAlign={"left"}
        colon={false}
      >
        <ProFormSelect
          width="xl"
          name="type"
          label={t("videoType")}
          disabled
          placeholder={t("pleaseSelectVideoType")}
        />
        <ProFormSwitch label={t("showNumberOfEpisodes")} name="teleplay" />
        <Form.Item noStyle shouldUpdate>
          {(form) => {
            if (form.getFieldValue("teleplay")) {
              return (
                <ProFormDigit
                  label={t("numberOfEpisodes")}
                  tooltip={t("canUseMouseWheelToAdjust")}
                  name="numberOfEpisodes"
                  width="xl"
                  min={1}
                  max={10000}
                />
              );
            }
          }}
        </Form.Item>

        <ProFormText
          width="xl"
          name="name"
          label={t("videoName")}
          placeholder={t("pleaseEnterVideoName")}
          rules={[
            {
              required: true,
              message: t("pleaseEnterVideoName"),
            },
          ]}
        />
        <ProFormText
          width="xl"
          name="url"
          label={t("videoLink")}
          placeholder={t("pleaseEnterVideoLink")}
          rules={[
            {
              required: true,
              message: t("pleaseEnterVideoLink"),
            },
          ]}
        />
      </ModalForm>
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
