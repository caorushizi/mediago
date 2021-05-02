import React, { Component, ReactNode } from "react";
import "./index.scss";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import { remote, is } from "renderer/common/scripts/electron";

interface Props {
  extraButton?: ReactNode[];
  color?: string;
  onClose: () => void;
}

class WindowToolBar extends Component<Props, Record<string, never>> {
  render(): ReactNode {
    const { extraButton, children, onClose, color = "#fff" } = this.props;
    return (
      <div className="window-tool-bar" style={{ background: color }}>
        <div className="window-tool-bar-left">{children}</div>
        <div className="window-tool-bar-right">
          {extraButton?.map((item) => (
            <div className="btn">{item}</div>
          ))}
          {is.windows && (
            <div
              className="btn"
              onClick={() => {
                remote.getCurrentWindow().minimize();
              }}
            >
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
