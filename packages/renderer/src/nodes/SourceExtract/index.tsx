import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileAddOutlined,
  HomeOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Avatar, Button, Input, List, message, Space } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { increase } from "../../store/downloadSlice";
import { requestImage } from "../../utils";
import { isUrl } from "../../utils/url";
import "./index.scss";

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

const SourceExtract: React.FC = () => {
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
    }

    return () => {
      resizeObserver.current?.disconnect();
      setWebviewBounds({ x: 0, y: 0, height: 0, width: 0 });
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

  const renderWebviewSider = () => {
    return (
      <div className="webview-sider">
        <List
          size="small"
          bordered
          dataSource={sourceList}
          renderItem={(item) => (
            <List.Item className="list-item" title={item.title}>
              <Space>
                <PlayCircleOutlined />
                <div className="title">{item.title}</div>
                {/* <Button type="link" icon={<CloudDownloadOutlined />} /> */}
                <Button
                  type="link"
                  onClick={() => onAddDownloadItem(item)}
                  icon={<FileAddOutlined />}
                />
              </Space>
            </List.Item>
          )}
        />
      </div>
    );
  };

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

  return (
    <PageContainer className="source-extract">
      {renderToolbar()}
      <div className="source-extract-content">
        {inputVal ? (
          <div className="webview-container">
            <div className="webview-inner" ref={webviewRef} />
            {sourceList.length > 0 && renderWebviewSider()}
          </div>
        ) : (
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
        )}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
