import { useEffect, useState } from "react";
import { FloatButton, Button, Dropdown, Space } from "antd";
import "./App.scss";
import logo from "./assets/logo.png";
import { WebSource } from "./types";
import { ipcRenderer } from "electron/renderer";

function App() {
  const [items, setItems] = useState<WebSource[]>([]);
  const [count, setCount] = useState(0);

  const receiveMessage = (_: unknown, data: WebSource) => {
    setItems((item) => [...item, data]);
    setCount((c) => c + 1);
  };

  useEffect(() => {
    ipcRenderer.on("webview-link-message", receiveMessage);

    return () => {
      ipcRenderer.removeListener("webview-link-message", receiveMessage);
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="app">
      <Dropdown
        placement="topLeft"
        menu={{
          items: items.map((item) => ({
            key: item.name,
            label: (
              <Space
                onClick={() => {
                  ipcRenderer.invoke("add-download-item", {
                    name: item.name,
                    url: item.url,
                    type: item.type,
                  });
                }}
              >
                <div>{item.name}</div>
                <Button type="link" style={{ padding: 0 }}>
                  添加
                </Button>
              </Space>
            ),
          })),
        }}
        trigger={["click"]}
      >
        <FloatButton
          className="app-float-button"
          icon={<img className="app-logo" src={logo} alt="" />}
          shape="square"
          badge={{
            count,
            offset: [10, 0],
          }}
          onClick={() => {
            setCount(0);
          }}
        />
      </Dropdown>
    </div>
  );
}

export default App;
