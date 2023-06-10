import React, { FC, useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import "./index.scss";
import axios from "axios";
import { useAsyncEffect, useRequest } from "ahooks";
import { List, Typography, Space, Button, Tooltip } from "antd";
import { LikeOutlined, SyncOutlined } from "@ant-design/icons";

interface Video {
  url: string;
  name: string;
}

// 获取视频列表
const getVideoList = async (): Promise<Video[]> =>
  axios.get("http://localhost:3000/api/video-list").then((res) => res.data);

// 播放器页面
const PlayerPage: FC = () => {
  const playerRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player>();
  const { data: videoList, refresh, loading } = useRequest(getVideoList);

  useAsyncEffect(async () => {
    if (!playerRef.current) return;

    player.current = new Player({
      el: playerRef.current,
      url: videoList?.[0].url,
      videoInit: true,
    });
  }, []);

  return (
    <div className="player-page">
      <div ref={playerRef}></div>
      <div className="video-list">
        <Space.Compact block>
          <Tooltip title="Like">
            <Button
              onClick={() => {
                refresh();
              }}
              icon={<SyncOutlined />}
              loading={loading}
            ></Button>
          </Tooltip>
        </Space.Compact>
        <List
          bordered
          dataSource={videoList}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                if (!player.current) return;

                player.current.src = item.url;
              }}
            >
              {item.name}
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default PlayerPage;
