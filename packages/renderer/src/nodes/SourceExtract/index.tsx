import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloudDownloadOutlined,
  FileAddOutlined,
  HomeOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Avatar, Button, Input, List, Space } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
import { increase } from "../../store/downloadSlice";
import { isUrl } from "../../utils/url";
import "./index.scss";
// import Hls, { ManifestLoadedData, LevelLoadedData } from "hls.js";

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
  } = useElectron();
  const dispatch = useDispatch();
  const [url, setUrl] = useState<string>("");
  const [inputVal, setInputVal] = useState("");
  const [sourceList, setSourceList] = useState<LinkMessage[]>([]);
  const { data, run } = useRequest(getFavorites);
  const webviewRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver>();
  const downloadList = useRef<LinkMessage[]>([]);
  const [title, setTitle] = useState("");

  const isFavorite = (data || []).findIndex((item) => item.url === url) >= 0;

  const goto = async () => {
    let finalUrl = inputVal;
    if (!/^https?:\/\//.test(inputVal)) {
      finalUrl = `http://${inputVal}`;
    }
    if (!isUrl(finalUrl)) {
      finalUrl = `https://baidu.com/s?word=${inputVal}`;
    }

    await webviewLoadURL(finalUrl);
    setUrl(finalUrl);
    setInputVal(finalUrl);
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
    if (isFavorite) {
      await removeFavorite(url);
    } else {
      const u = new URL(url);

      await addFavorite({
        url,
        title: title || url,
        icon: u.origin ? `${u.origin}/favicon.ico` : "",
      });
    }
    run();
  };

  const onClickGoBack = async () => {
    const back = await webviewGoBack();

    if (!back) {
      setUrl("");
      setInputVal("");
    }
  };

  const onClickGoHome = async () => {
    await webwiewGoHome();
    setUrl("");
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

  const onClickLoadURL = async (item: { url: string }) => {
    await webviewLoadURL(item.url);
    setUrl(item.url);
    setInputVal(item.url);
  };

  const onDomReady = (e: any, data: { url: string; title: string }) => {
    if (data.url) {
      document.title = data.title;
      setUrl(data.url);
      setInputVal(data.url);
      setTitle(data.title);
    }
  };

  const receiveLinkMessage = (e: any, msg: LinkMessage) => {
    console.log("receive: =============", msg);
    // downloadList.current.unshift(msg);

    // setSourceList([msg, ...downloadList.current]);
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
  }, [!!url]);

  useEffect(() => {
    const prevTitle = document.title;
    rendererEvent("webview-dom-ready", onDomReady);
    rendererEvent("webview-link-message", receiveLinkMessage);

    return () => {
      document.title = prevTitle;
      removeEventListener("webview-dom-ready", onDomReady);
      removeEventListener("webview-link-message", receiveLinkMessage);
      console.log("remove: removeremoveremoveremove");
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
        {url && (
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
              {isFavorite ? <StarFilled /> : <StarOutlined />}
            </Button>
          </>
        )}
        <Input
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
        {url ? (
          <div className="webview-container">
            <div className="webview-inner" ref={webviewRef} />
            {sourceList.length > 0 && renderWebviewSider()}
          </div>
        ) : (
          <List
            grid={{ gutter: 16, lg: 5, xl: 7, xxl: 7 }}
            className="list-container"
            itemLayout="vertical"
            dataSource={data}
            renderItem={(item) => (
              <List.Item className="list-item">
                <div
                  className="list-tem-card"
                  onClick={() => onClickLoadURL(item)}
                >
                  <Avatar size={52} src={item.icon} icon={<LinkOutlined />} />
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
