import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  DownloadOutlined,
  HomeOutlined,
  ImportOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
  Avatar,
  Button,
  Collapse,
  Form,
  Input,
  List,
  message,
  Space,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { increase } from "../../store/downloadSlice";
import { getFavIcon } from "../../utils";
import { isUrl } from "../../utils/url";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./index.scss";
import { ModalForm, ProFormText } from "@ant-design/pro-components";

const { Panel: AntDPanel } = Collapse;

interface DivRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const computeRect = ({ left, top, width, height }: DivRect) => ({
  x: Math.floor(left),
  y: Math.floor(top),
  width: Math.floor(width),
  height: Math.floor(height),
});

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const {
    getFavorites,
    addFavorite,
    removeFavorite,
    setWebviewBounds,
    webviewLoadURL,
    rendererEvent,
    removeEventListener,
    webviewGoBack,
    webviewReload,
    webwiewGoHome,
    addDownloadItem,
    onFavoriteItemContextMenu,
    webviewHide,
    webviewShow,
    downloadNow,
    combineToHomePage,
  } = useElectron();
  const dispatch = useDispatch();
  const [inputVal, setInputVal] = useState("");
  const [hoverId, setHoverId] = useState<number>(-1);
  const [sourceList, setSourceList] = useState<LinkMessage[]>([]);
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const webviewRef = useRef<HTMLDivElement>(null);
  const currentUrlRef = useRef("");
  const currentTitleRef = useRef("");
  const resizeObserver = useRef<ResizeObserver>();
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const [messageApi, contextHolder] = message.useMessage();

  const curIsFavorite = favoriteList.find(
    (item) => item.url === currentUrlRef.current
  );

  const loadUrl = async (url: string) => {
    await webviewLoadURL(url);
    currentUrlRef.current = url;
    setInputVal(url);
  };

  const goto = async () => {
    let finalUrl = inputVal;
    if (!/^https?:\/\//.test(inputVal)) {
      finalUrl = `http://${inputVal}`;
    }
    if (!isUrl(finalUrl)) {
      finalUrl = `https://baidu.com/s?word=${inputVal}`;
    }

    await loadUrl(finalUrl);
  };

  const onInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputVal) {
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
      const icon = await getFavIcon(currentUrlRef.current);
      await addFavorite({
        url: currentUrlRef.current,
        title: currentTitleRef.current || currentUrlRef.current,
        icon,
      });
    }
    refresh();
  };

  const onClickGoBack = async () => {
    const back = await webviewGoBack();

    if (!back) {
      currentUrlRef.current = "";
      setInputVal("");
    }
  };

  const onClickGoHome = async () => {
    await webwiewGoHome();
    currentUrlRef.current = "";
    setInputVal("");
  };

  const onClickReload = () => {
    webviewReload();
  };

  const onClickEnter = async () => {
    if (!inputVal) {
      return;
    }

    await goto();
  };

  const onClickLoadItem = async (item: Favorite) => {
    await loadUrl(item.url);
  };

  const onDomReady = (e: any, data: { url: string; title: string }) => {
    if (data.url) {
      document.title = data.title;
      currentUrlRef.current = data.url;
      currentTitleRef.current = data.title;
      setInputVal(data.url);
    }
  };

  const receiveLinkMessage = (e: any, msg: LinkMessage) => {
    if (!sourceList.find((item) => item.url === msg.url)) {
      setSourceList((list) => [msg, ...list]);
    }
  };

  useEffect(() => {
    if (webviewRef.current != null) {
      // 监控 webview 元素的大小
      resizeObserver.current = new ResizeObserver((entries) => {
        if (!webviewRef.current) {
          return;
        }

        const rect = computeRect(webviewRef.current?.getBoundingClientRect());

        const entry = entries[0];
        const viewRect = computeRect(entry.contentRect);
        viewRect.x += rect.x;
        viewRect.y += rect.y;
        setWebviewBounds(viewRect);
      });

      resizeObserver.current.observe(webviewRef.current);
      webviewShow();
    }

    return () => {
      resizeObserver.current?.disconnect();
      webviewHide();
    };
  }, [!!currentUrlRef.current]);

  const onFavoriteEvent = async (
    e: any,
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

  useEffect(() => {
    const prevTitle = document.title;
    rendererEvent("webview-dom-ready", onDomReady);
    rendererEvent("webview-link-message", receiveLinkMessage);
    rendererEvent("favorite-item-event", onFavoriteEvent);

    return () => {
      document.title = prevTitle;
      removeEventListener("webview-dom-ready", onDomReady);
      removeEventListener("webview-link-message", receiveLinkMessage);
      removeEventListener("favorite-item-event", onFavoriteEvent);
    };
  }, []);

  const onAddDownloadItem = (item: LinkMessage) => {
    dispatch(increase());
    addDownloadItem({
      name: item.title,
      url: item.url,
    });
  };

  const onDownloadNow = (item: LinkMessage) => {
    dispatch(increase());
    downloadNow({
      name: item.title,
      url: item.url,
    });
  };

  // 渲染收藏夹
  const renderWebviewSider = () => {
    return (
      <div className="webview-sider">
        <Collapse className="webview-sider-inner" bordered={false} size="small">
          {sourceList.map((item) => {
            return (
              <AntDPanel
                className="sider-list-container"
                header={item.title}
                key={item.url}
                extra={
                  <Space>
                    <Button
                      type="link"
                      title="添加到下载列表"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddDownloadItem(item);
                      }}
                      icon={<PlusOutlined />}
                    />
                    <Button
                      type="link"
                      title="立即下载"
                      icon={<DownloadOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDownloadNow(item);
                      }}
                    />
                  </Space>
                }
              >
                <div className="sider-list">
                  <div className="sider-item">视频名： {item.title}</div>
                  <div className="sider-item">视频链接： {item.url}</div>
                </div>
              </AntDPanel>
            );
          })}
        </Collapse>
      </div>
    );
  };

  // 合并到主页
  const onCombineToHome = () => {
    combineToHomePage();
  };

  // 渲染工具栏
  const renderToolbar = () => {
    return (
      <Space.Compact className="action-bar" block>
        {inputVal && (
          <>
            <Button title="回退" type="text" onClick={onClickGoBack}>
              <ArrowLeftOutlined />
            </Button>
            <Button title="刷新" type="text" onClick={onClickReload}>
              <ReloadOutlined />
            </Button>
            <Button title="首页" type="text" onClick={onClickGoHome}>
              <HomeOutlined />
            </Button>
            <Button
              type="text"
              title={curIsFavorite ? "取消收藏" : "收藏"}
              onClick={onClickAddFavorite}
            >
              {curIsFavorite ? <StarFilled /> : <StarOutlined />}
            </Button>
          </>
        )}
        <Input
          key="url-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="请输入网址链接……"
        />
        <Button title="访问" type="text" onClick={onClickEnter}>
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
    return (
      <div className="webview-container">
        <PanelGroup autoSaveId="example" direction="horizontal">
          <Panel minSize={50}>
            <div className="webview-inner" ref={webviewRef} />
          </Panel>
          {sourceList.length > 0 && (
            <>
              <PanelResizeHandle className="divider">
                <div className="handle" />
              </PanelResizeHandle>
              <Panel minSize={30}>{renderWebviewSider()}</Panel>
            </>
          )}
        </PanelGroup>
      </div>
    );
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
          }}
          submitTimeout={2000}
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
              size="small"
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
            <Avatar size="small" src={item.icon} icon={<LinkOutlined />} />
          ) : (
            <Avatar size="small" icon={<LinkOutlined />} />
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
        {inputVal ? renderBrowserPanel() : renderFavoriteList()}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
