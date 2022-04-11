import React, { FC, PropsWithChildren } from "react";
import "./index.scss";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import useElectron from "renderer/hooks/electron";

interface Props {
  color?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

const WindowToolBar: FC<PropsWithChildren<Props>> = ({
  onClose,
  onMinimize,
  color = "#fff",
  children,
}) => {
  const { isMacos, isWindows } = useElectron();

  return (
    <div className="window-tool-bar" style={{ background: color }}>
      <div className="window-tool-bar-left">
        {isMacos && <div className="mac-btn close" onClick={onClose} />}
        {isMacos && <div className="mac-btn min" onClick={onMinimize} />}
      </div>
      <div className="window-tool-bar-title">{children}</div>
      <div className="window-tool-bar-right">
        {isWindows && (
          <div className="btn" onClick={onMinimize}>
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
