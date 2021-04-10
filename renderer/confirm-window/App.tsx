import React from "react";
import WindowToolBar from "../common/components/WindowToolBar";

interface Props {}

interface State {}

class SettingWindow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div className="confirm-window">
        <WindowToolBar onClose={() => {}}>是否确认</WindowToolBar>
        <div className="window-inner" />
      </div>
    );
  }
}

export default SettingWindow;
