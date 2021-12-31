import React, { FC, PropsWithChildren } from "react";
import "./index.scss";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import useElectron from "renderer/hooks/electron";

interface Props {
  color?: string;
  onClose: () => void;
}

const WindowToolBar: FC<PropsWithChildren<Props>> = ({
  onClose,
  color = "#fff",
  children,
}) => {
  const { isMacos, isWindows } = useElectron();
  // 最小化窗口
  const minimizeWindow = (): void => {
    // TODO: 最小化窗口
    // remote.getCurrentWindow().minimize();
  };

  return (
    <div className="window-tool-bar" style={{ background: color }}>
      <div className="window-tool-bar-left">
        {isMacos && <div className="mac-btn close" onClick={onClose} />}
        {isMacos && <div className="mac-btn min" onClick={minimizeWindow} />}
      </div>
      <div className="window-tool-bar-title">{children}</div>
      <div className="window-tool-bar-right">
        {isWindows && (
          <div className="btn" onClick={minimizeWindow}>
            <MinusOutlined />
          </div>
        )}
        {isWindows && (
          <div className="btn close" onClick={onClose}>
            <CloseOutlined />
          </div>
        )}
      </div>
    </div>
  );
};

export default WindowToolBar;
