import React, { Component, ReactNode } from "react";
import "./index.scss";
import {
  BorderOutlined,
  CloseOutlined,
  MinusOutlined,
} from "@ant-design/icons";

interface Props {
  leftContent?: ReactNode;
  extraButton?: ReactNode[];
  onClose: () => void;
}
interface State {}

class WindowToolBar extends Component<Props, State> {
  static propTypes = {};

  constructor(props: Props) {
    super(props);
  }

  render() {
    const { leftContent, extraButton, children, onClose } = this.props;
    return (
      <div className="window-tool-bar">
        <div className="window-tool-bar-left">{leftContent}</div>
        <div className="window-tool-bar-title">{children}</div>
        <div className="window-tool-bar-right">
          {extraButton?.map((item) => (
            <div className="btn">{item}</div>
          ))}
          <div className="btn">
            <MinusOutlined />
          </div>
          <div className="btn">
            <BorderOutlined />
          </div>
          <div className="btn close">
            <CloseOutlined onClick={onClose} />
          </div>
        </div>
      </div>
    );
  }
}

export default WindowToolBar;
