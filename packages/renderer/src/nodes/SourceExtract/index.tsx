import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Input, List, Space } from "antd";
import React, { useState } from "react";
import PageContainer from "../../components/PageContainer";
import { isUrl } from "../../utils/url";
import "./index.scss";

const data = [
  {
    title: "Title 1",
  },
];

const SourceExtract: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [inputVal, setInputVal] = useState("");
  const [sourceList, setSourceList] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputVal) {
      return;
    }
    if (e.key !== "Enter") {
      return;
    }

    let finalUrl = inputVal;
    if (!/^https?:\/\//.test(inputVal)) {
      finalUrl = `http://${inputVal}`;
    }
    if (!isUrl(finalUrl)) {
      finalUrl = `https://baidu.com/s?word=${inputVal}`;
    }

    console.log("isUrl: ", finalUrl);
    setUrl(finalUrl);
    setInputVal(finalUrl);
  };

  console.log("url: ", url);

  return (
    <PageContainer className="source-extract">
      <Space.Compact className="action-bar" block>
        <Button type="text">
          <ArrowLeftOutlined />
        </Button>
        <Button type="text">
          <ReloadOutlined />
        </Button>
        {url && (
          <Button
            type="text"
            onClick={() => {
              setUrl("");
            }}
          >
            <HomeOutlined />
          </Button>
        )}
        {url && (
          <Button type="text">
            {isFavorite ? <StarFilled /> : <StarOutlined />}
          </Button>
        )}
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="请输入网址链接……"
        />
        <Button type="text">
          <ArrowRightOutlined />
        </Button>
      </Space.Compact>
      <div className="source-extract-content">
        {url ? (
          <div className="webview-container">
            <webview
              className="webview-inner"
              src={url}
              // eslint-disable-next-line react/no-unknown-property
              partition="persist:webview"
            />
            {sourceList.length > 0 && <div className="webview-sider">123</div>}
          </div>
        ) : (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 4,
              lg: 4,
              xl: 6,
              xxl: 3,
            }}
            className="list-container"
            itemLayout="vertical"
            dataSource={data}
            renderItem={(item) => (
              <List.Item className="list-item">
                <div
                  className="list-tem-card"
                  onClick={() => {
                    setUrl("https://baidu.com");
                  }}
                >
                  <Avatar size={52} icon={<UserOutlined />} />
                  <div className="card-text">123</div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
