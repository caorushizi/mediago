import React, { Component, ReactNode } from "react";
import "./index.scss";
import close from "./assets/close.png";
import minimize from "./assets/minimize.png";
import maximize from "./assets/maximize.png";

interface Props {
  leftContent?: ReactNode;
  extraButton?: ReactNode[];
  color: string;
  onClose: () => void;
}

interface State {}

class WindowToolBar extends Component<Props, State> {
  render(): ReactNode {
    const {
      leftContent,
      extraButton,
      children,
      onClose,
      color = "#e2e2e2",
    } = this.props;
    return (
      <div className="window-tool-bar" style={{ background: color }}>
        <div className="window-tool-bar-left">{leftContent}</div>
        <div className="window-tool-bar-title">{children}</div>
        <div className="window-tool-bar-right">
          {extraButton?.map((item) => (
            <div className="btn">{item}</div>
          ))}
          <div className="btn">
            <img src={minimize} alt="" />
          </div>
          <div className="btn">
            <img src={maximize} alt="" />
          </div>
          <div role="presentation" className="btn close" onClick={onClose}>
            <img src={close} alt="" />
          </div>
        </div>
      </div>
    );
  }
}

export default WindowToolBar;
