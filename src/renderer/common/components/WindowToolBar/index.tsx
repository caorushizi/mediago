import React, { Component, ReactNode } from "react";
import "./index.scss";
import {
  CloseOutlined,
  FullscreenOutlined,
  MinusOutlined,
} from "@ant-design/icons";

interface Props {
  extraButton?: ReactNode[];
  color?: string;
  onClose: () => void;
}

interface State {}

class WindowToolBar extends Component<Props, State> {
  render(): ReactNode {
    const { extraButton, children, onClose, color = "#fff" } = this.props;
    return (
      <div className="window-tool-bar" style={{ background: color }}>
        <div className="window-tool-bar-left">{children}</div>
        <div className="window-tool-bar-right">
          {extraButton?.map((item) => (
            <div className="btn">{item}</div>
          ))}
          <div className="btn">
            <MinusOutlined />
          </div>
          <div className="btn close" onClick={onClose}>
            <CloseOutlined />
          </div>
        </div>
      </div>
    );
  }
}

export default WindowToolBar;
