import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloudDownloadOutlined,
  FileAddOutlined,
  HomeOutlined,
  LinkOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Avatar, Button, Collapse, Input, List, Space } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { increase } from "../../store/downloadSlice";
import { requestImage } from "../../utils";
import { isUrl } from "../../utils/url";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./index.scss";

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
  } = useElectron();
  const dispatch = useDispatch();
  const [inputVal, setInputVal] = useState("");
  const [sourceList, setSourceList] = useState<LinkMessage[]>([]);
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const webviewRef = useRef<HTMLDivElement>(null);
  const currentUrlRef = useRef("");
  const currentTitleRef = useRef("");
  const resizeObserver = useRef<ResizeObserver>();

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
      let iconUrl = "";
      try {
        const urlObject = new URL(currentUrlRef.current);
        const fetchUrl = urlObject.origin
          ? `${urlObject.origin}/favicon.ico`
          : "";
        await requestImage(fetchUrl);
        iconUrl = fetchUrl;
      } catch (e) {
        // empty
      }

      await addFavorite({
        url: currentUrlRef.current,
        title: currentTitleRef.current || currentUrlRef.current,
        icon: iconUrl,
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
    setSourceList((list) => [msg, ...list]);
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
      // setWebviewBounds({ x: 0, y: 0, height: 0, width: 0 });
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

  const genExtra = (item: LinkMessage) => {
    return (
      <Space>
        <Button type="link" title="立即下载" icon={<CloudDownloadOutlined />} />
        <Button
          type="link"
          title="添加到下载列表"
          onClick={() => onAddDownloadItem(item)}
          icon={<FileAddOutlined />}
        />
      </Space>
    );
  };

  // 渲染收藏夹
  const renderWebviewSider = () => {
    return (
      <div className="webview-sider">
        <Collapse className="webview-sider-inner">
          {sourceList.map((item, index) => {
            return (
              <AntDPanel header={item.title} key={index} extra={genExtra(item)}>
                <div>{123}</div>
              </AntDPanel>
            );
          })}
        </Collapse>
      </div>
    );
  };

  // 渲染工具栏
  const renderToolbar = () => {
    return (
      <Space.Compact className="action-bar" block>
        {inputVal && (
          <>
            <Button type="text" onClick={onClickGoBack}>
              <ArrowLeftOutlined />
            </Button>
            <Button type="text" onClick={onClickReload}>
              <ReloadOutlined />
            </Button>
            <Button type="text" onClick={onClickGoHome}>
              <HomeOutlined />
            </Button>
            <Button type="text" onClick={onClickAddFavorite}>
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
        <Button type="text" onClick={onClickEnter}>
          <ArrowRightOutlined />
        </Button>
      </Space.Compact>
    );
  };

  // 渲染浏览器面板
  const renderBrowserPanel = () => {
    return (
      <div className="webview-container">
        {sourceList.length > 0 ? (
          <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel minSize={50}>
              <div className="webview-inner" ref={webviewRef} />
            </Panel>
            <PanelResizeHandle className="divider">
              <div className="handle" />
            </PanelResizeHandle>
            <Panel minSize={30}>{renderWebviewSider()}</Panel>
          </PanelGroup>
        ) : (
          <div className="webview-inner" ref={webviewRef} />
        )}
      </div>
    );
  };

  const renderFavoriteList = () => {
    return (
      <List
        grid={{ gutter: 16, lg: 5, xl: 7, xxl: 7 }}
        className="list-container"
        itemLayout="vertical"
        dataSource={favoriteList}
        renderItem={(item) => (
          <List.Item
            className="list-item"
            onContextMenu={() => {
              onFavoriteItemContextMenu(item.id);
            }}
          >
            <div
              className="list-tem-card"
              onClick={() => onClickLoadItem(item)}
            >
              {item.icon ? (
                <Avatar size={52} src={item.icon} icon={<LinkOutlined />} />
              ) : (
                <Avatar size={52} icon={<LinkOutlined />} />
              )}
              <div className="card-text">{item.title}</div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  return (
    <PageContainer
      className={"source-extract"}
      extraClassName={page ? "is-page" : ""}
    >
      {renderToolbar()}
      <div className="source-extract-content">
        {inputVal ? renderBrowserPanel() : renderFavoriteList()}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
