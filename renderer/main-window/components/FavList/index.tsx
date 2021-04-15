import React, { ReactNode } from "react";
import "./index.scss";
import { Button, Col, Popconfirm, Row, Space } from "antd";
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
        <Space className="button-wrapper">
          <Button type="primary" icon={<PlusOutlined />}>
            添加收藏
          </Button>
        </Space>
        <div className="fav-wrapper">
          {favs.map((fav) => (
            <Row className="fav-item" key={fav.url}>
              <Col span={18} className="fav-item__title">
                {fav.title}
              </Col>
              <Col span={6} className="fav-item__action">
                <Button
                  type="link"
                  onClick={() => {
                    ipcRenderer.send("openBrowserWindow", fav.url);
                  }}
                >
                  打开链接
                </Button>
                <Popconfirm
                  placement="topRight"
                  title="确认要删除这个收藏吗？"
                  onConfirm={async () => {
                    await removeFav(fav);
                    const favList = await getFavs();
                    this.setState({ favs: favList });
                  }}
                  okText="删除"
                  okButtonProps={{ danger: true }}
                  cancelText="取消"
                >
                  <Button type="link" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Col>
            </Row>
          ))}
        </div>
      </div>
    );
  }
}

export default FavList;
