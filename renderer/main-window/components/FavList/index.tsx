import React, { ReactNode } from "react";
import "./index.scss";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getFavs, removeFav } from "renderer/common/scripts/localforge";
import { Fav } from "types/common";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

interface Props {}

interface State {
  favs: Fav[];
}

class FavList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      favs: [],
    };
  }

  async componentDidMount(): Promise<void> {
    const favs = await getFavs();
    this.setState({ favs });
  }

  render(): ReactNode {
    const { favs } = this.state;
    return (
      <div className="fav-list">
        <Button type="primary" icon={<PlusOutlined />}>
          添加收藏
        </Button>
        {favs.map((fav) => (
          <div className="fav-item">
            <div className="left">{fav.title}</div>
            <div className="right">
              <Button
                type="link"
                onClick={() => {
                  ipcRenderer.send("openBrowserWindow", fav.url);
                }}
              >
                打开链接
              </Button>
              <Button
                type="link"
                danger
                onClick={async () => {
                  await removeFav(fav);
                  const favList = await getFavs();
                  this.setState({ favs: favList });
                }}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default FavList;
