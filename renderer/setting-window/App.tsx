import React from "react";
import "./index.scss";
import WindowToolBar from "../common/components/WindowToolBar";

interface Props {}

interface State {}

class SettingWindow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div className="setting-window">
        <WindowToolBar onClose={() => {}}>设置页面</WindowToolBar>
        <div className="window-inner">
          <ul>
            <li>下载路径</li>
            <li>系统代理</li>
            <li>简易模式\高级模式</li>
            <li>添加预设模式</li>
          </ul>
        </div>
      </div>
    );
  }
}

export default SettingWindow;
