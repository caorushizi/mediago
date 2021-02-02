import React from "react";
import { remote } from "electron";
import { Nav } from "@fluentui/react";
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
    const { dir, key } = this.state;

    const onLinkClick = (e, item) => {
      console.log(item);
      this.setState({
        key: item.key,
      });
    };

    const navLinkGroups = [
      {
        name: "Media Download",
        links: [
          {
            name: "下载",
            key: "download",
          },
          {
            name: "视频",
            key: "video",
          },
          {
            name: "设置",
            key: "settings",
          },
        ],
      },
    ];

    const onRenderGroupHeader = (group) => <h3>{group.name}</h3>;

    const mainContent = () => {
      const { key } = this.state;
      switch (key) {
        case "download":
          return <Download local={dir} />;
        case "video":
          return <Video />;
        case "settings":
          return <Settings dir={dir} handleSelectDir={this.handleSelectDir} />;
        default:
          return <Settings dir={dir} handleSelectDir={this.handleSelectDir} />;
      }
    };

    return (
      <div className="app">
        <Nav
          onLinkClick={onLinkClick}
          onRenderGroupHeader={onRenderGroupHeader}
          selectedKey={key}
          ariaLabel="Nav example with custom group headers"
          groups={navLinkGroups}
        />
        <div className="main-wrapper">{mainContent()}</div>
      </div>
    );
  }
}

export default App;
