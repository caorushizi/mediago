import React, { Component, ReactNode } from "react";
import "./index.scss";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import { remote, is } from "renderer/common/scripts/electron";

interface Props {
  color?: string;
  onClose: () => void;
}

class WindowToolBar extends Component<Props, Record<string, never>> {
  // 最小化窗口
  minimizeWindow = (): void => {
    remote.getCurrentWindow().minimize();
  };

  render(): ReactNode {
    const { children, onClose, color = "#fff" } = this.props;
    return (
      <div className="window-tool-bar" style={{ background: color }}>
        <div className="window-tool-bar-left">
          {is.macos && <div className="mac-btn close" onClick={onClose} />}
          {is.macos && (
            <div className="mac-btn min" onClick={this.minimizeWindow} />
          )}
          {/*{is.macos && <div className="mac-btn max" />}*/}
        </div>
        <div className="window-tool-bar-title">{children}</div>
        <div className="window-tool-bar-right">
          {is.windows && (
            <div className="btn" onClick={this.minimizeWindow}>
              <MinusOutlined />
            </div>
          )}
          {is.windows && (
            <div className="btn close" onClick={onClose}>
              <CloseOutlined />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default WindowToolBar;
