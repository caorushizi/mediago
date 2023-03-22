import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Avatar, Button, Input, List, Space } from "antd";
import React, { useEffect, useRef, useState } from "react";
import PageContainer from "../../components/PageContainer";
import useElectron from "../../hooks/electron";
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
  } = useElectron();
  const [url, setUrl] = useState<string>("");
  const [inputVal, setInputVal] = useState("");
  const [sourceList, setSourceList] = useState<LinkMessage[]>([]);
  const { data, run } = useRequest(getFavorites);
  const webviewRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver>();
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
    console.log("back: ", back);

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

  const receiveLinkMessage = (e: any, url: LinkMessage) => {
    console.log(url);
    setSourceList([...sourceList, url]);
  };

  useEffect(() => {
    console.log("webviewRef.current", webviewRef.current);

    if (webviewRef.current != null) {
      console.log("123123");

      // 监控 webview 元素的大小
      resizeObserver.current = new ResizeObserver((entries) => {
        if (!webviewRef.current) {
          return;
        }

        const rect = computeRect(webviewRef.current?.getBoundingClientRect());
        console.log("rect", rect);

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
    rendererEvent("webview-link-message", receiveLinkMessage);

    return () => {
      removeEventListener("webview-link-message", receiveLinkMessage);
    };
  }, [sourceList]);

  useEffect(() => {
    const prevTitle = document.title;
    rendererEvent("webview-dom-ready", onDomReady);

    return () => {
      document.title = prevTitle;
      removeEventListener("webview-dom-ready", onDomReady);
    };
  }, []);

  return (
    <PageContainer className="source-extract">
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
      <div className="source-extract-content">
        {url ? (
          <div className="webview-container">
            <div className="webview-inner" ref={webviewRef} />
            {sourceList.length > 0 && (
              <div className="webview-sider">
                <List
                  size="small"
                  bordered
                  dataSource={sourceList}
                  renderItem={(item) => (
                    <List.Item>
                      <div className="list-item">
                        <PlayCircleOutlined />
                        {item.title}
                        <Button type="link">立即下载</Button>
                        <Button type="link">添加</Button>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        ) : (
          <List
            grid={{
              gutter: 16,
              sm: 2,
              md: 5,
              lg: 5,
              xl: 7,
              xxl: 7,
            }}
            className="list-container"
            itemLayout="vertical"
            dataSource={data}
            renderItem={(item) => (
              <List.Item className="list-item">
                <div
                  className="list-tem-card"
                  onClick={() => onClickLoadURL(item)}
                >
                  {item.icon ? (
                    <Avatar
                      size={52}
                      src={<img src={item.icon} alt="avatar" />}
                    />
                  ) : (
                    <Avatar size={52} icon={<UserOutlined />} />
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
