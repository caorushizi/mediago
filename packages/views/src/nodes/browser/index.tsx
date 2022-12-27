import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import "./index.scss";
import { Avatar } from "antd";
import { extractColorByName, isUrl, onEvent } from "../../utils";
import "antd/dist/reset.css";
import SearchBar from "./elements/SearchBar";
import { useRequest } from "ahooks";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../store/reducers";
import {
  BrowserState,
  setBrowserView,
} from "../../store/actions/browser.actions";
import { getFavList } from "../../assets/api";

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

const {
  browserViewGoBack,
  browserViewReload,
  browserViewLoadURL,
  addEventListener,
} = window.electron;

const BrowserWindow: FC = () => {
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isFav, setIsFav] = useState<boolean>(false);
  const webviewRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver>();

  const { data, run } = useRequest(getFavList);
  const dispatch = useDispatch();
  const browserState = useSelector<AppState, BrowserState>(
    (state) => state.browser
  );

  useEffect(() => {
    if (webviewRef.current != null) {
      // 监控 webview 元素的大小
      resizeObserver.current = new ResizeObserver((entries) => {
        if (webviewRef.current == null) {
          return;
        }
        const rect = computeRect(webviewRef.current.getBoundingClientRect());
        window.electron.setBrowserViewRect(rect);
        const entry = entries[0];
        const viewRect = computeRect(entry.contentRect);
        viewRect.x += rect.x;
        viewRect.y += rect.y;
        window.electron.setBrowserViewRect(viewRect);
      });

      resizeObserver.current.observe(webviewRef.current);
    }
    addEventListener("dom-ready", handleViewDOMReady);

    return () => {
      window.electron.setBrowserViewRect({ x: 0, y: 0, height: 0, width: 0 });
      window.electron.removeEventListener("dom-ready", handleViewDOMReady);
      resizeObserver.current?.disconnect();
    };
  }, [browserState.showBrowserView]);

  const handleViewDOMReady = (
    e: any,
    { url, title }: { url: string; title: string }
  ): void => {
    // todo: 添加收藏
    // const isFav = await isFavFunc(url);
    const isFav = false;
    setUrl(url);
    setTitle(title);
    setIsFav(isFav);
    document.title = title;
  };

  const onGoBack = (): void => {
    onEvent.browserPageGoBack();
    browserViewGoBack();
  };

  const onReload = (): void => {
    onEvent.browserPageReload();
    browserViewReload();
  };

  const onGoBackHome = (): void => {
    dispatch(setBrowserView(false));
    setUrl("");
  };

  const onUrlChange = (url: string): void => {
    setUrl(url);
  };

  const handleEnter = (): void => {
    browserViewLoadURL(url);
  };

  const handleClickFav = (): void => {
    // todo: 添加收藏取消收藏
    // const isFav = await isFavFunc(url);
    // if (isFav) {
    //   await removeFav({ title, url });
    // } else {
    //   await insertFav({ title, url });
    // }
    setIsFav((fav) => !fav);
  };

  const renderFavItem = (): ReactNode => {
    return (
      <div className="favorite-list">
        {data?.map((item, index) => {
          return (
            <div
              className={"favorite-item"}
              key={index}
              onClick={() => {
                dispatch(setBrowserView(true));
                window.electron.browserViewLoadURL(item.url);
              }}
            >
              <Avatar
                className={"item-avatar"}
                size="large"
                style={{ background: extractColorByName(item.id) }}
              >
                {item?.title[0]}
              </Avatar>
              <div className={"item-name"}>{item.title}</div>
            </div>
          );
        })}
        <ModalForm<Fav>
          width={500}
          layout="horizontal"
          title="添加收藏"
          trigger={
            <div className={"favorite-item"}>
              <Avatar style={{ verticalAlign: "middle" }} size="large">
                +
              </Avatar>
            </div>
          }
          onFinish={async (fav) => {
            onEvent.favPageAddFav();
            await window.electron.addCollection(fav);
            run();
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
      </div>
    );
  };

  return (
    <div className="browser-window">
      <div className="webview-container">
        <SearchBar
          className="webview-nav"
          url={url}
          isFav={isFav}
          onUrlChange={onUrlChange}
          onGoBack={onGoBack}
          onReload={onReload}
          onGoBackHome={onGoBackHome}
          handleEnter={handleEnter}
          handleClickFav={handleClickFav}
          isHomePage={browserState.showBrowserView}
        />
        <div className="webview-inner">
          {browserState.showBrowserView ? (
            <div id="videoView" ref={webviewRef}></div>
          ) : (
            renderFavItem()
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowserWindow;
