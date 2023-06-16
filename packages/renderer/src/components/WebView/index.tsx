import React, { FC, useRef, useEffect } from "react";
import useElectron from "../../hooks/electron";
import classNames from "classnames";
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

interface WebViewProps {
  className?: string;
}

const WebView: FC<WebViewProps> = ({ className }) => {
  const webviewRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver>();

  const { setWebviewBounds, webviewHide, webviewShow } = useElectron();

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
  }, []);

  return <div ref={webviewRef} className={classNames(className)} />;
};

export default WebView;
