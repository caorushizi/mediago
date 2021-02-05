import React from "react";
import { remote, ipcRenderer } from "electron";
import { Pivot, PivotItem } from "@fluentui/react";
import Video from "./components/Video";
import Download from "./components/Download";
import Settings from "./components/Settings";
import "./App.scss";
import { ipcGetStore, ipcSetStore } from "./utils";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dir: "",
      key: "settings",
    };

    this.handleSelectDir = this.handleSelectDir.bind(this);
  }

  async componentDidMount() {
    const dir = await ipcGetStore("local");
    this.setState({
      dir: dir || "",
    });
  }

  async handleSelectDir() {
    const { dir } = this.state;
    const result = remote.dialog.showOpenDialogSync({
      defaultPath: dir || remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    if (!result) return;
    const local = result[0];
    await ipcSetStore("local", local);
    this.setState({
      dir: local,
    });
  }

  render() {
    const { dir } = this.state;

    return (
      <>
        <div className="drag-region" />
        <div
          role="presentation"
          className="action-button"
          onClick={() => {
            ipcRenderer.send("closeMainWindow");
          }}
        >
          关闭
        </div>
        <Pivot className="app" styles={{ itemContainer: "main-wrapper" }}>
          <PivotItem headerText="下载">
            <Download local={dir} />
          </PivotItem>
          <PivotItem headerText="视频">
            <Video />
          </PivotItem>
          <PivotItem headerText="设置">
            <Settings dir={dir} handleSelectDir={this.handleSelectDir} />
          </PivotItem>
        </Pivot>
      </>
    );
  }
}

export default App;
