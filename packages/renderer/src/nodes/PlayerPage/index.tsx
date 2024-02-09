import React, { FC, useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import "./index.scss";
import axios from "axios";
import { useAsyncEffect, useToggle } from "ahooks";
import { List, Space, Button } from "antd";
import useElectron from "../../hooks/electron";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Video {
  id: number;
  url: string;
  name: string;
}

const port = import.meta.env.APP_SERVER_PORT;

// 播放器页面
const PlayerPage: FC = () => {
  const { getLocalIP } = useElectron();
  const { t } = useTranslation();
  const [showVideoList, { toggle }] = useToggle();
  const [showButton, setShowButton] = useState(false);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const playerRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player>();
  const location = useLocation();

  // 获取视频列表
  const getVideoList = async (): Promise<Video[]> => {
    const localIP = await getLocalIP();
    const baseURL = `http://${localIP}:${port}`;

    const videoListUrl = `${baseURL}/api/video-list`;
    const res = await axios.get(videoListUrl);
    return res.data.map((item: any) => ({
      ...item,
      url: `${baseURL}${item.url}`,
    }));
  };

  useAsyncEffect(async () => {
    if (!playerRef.current) return;
    if (player.current) return;

    const videoList = await getVideoList();
    setVideoList(videoList);

    if (!Array.isArray(videoList) || videoList.length === 0) return;
    let src = videoList[0].url;

    const queryParams = new URLSearchParams(location.search);
    const name = decodeURIComponent(queryParams.get("name"));
    if (name) {
      const video = videoList.find((item) => item.name === name);
      if (video) {
        src = video.url;
      }
    }

    player.current = new Player({
      el: playerRef.current,
      videoInit: true,
      fluid: true,
      keyShortcut: true,
      url: src,
      playNext: {
        urlList: videoList.map((item) => item.url),
      },
    });
  }, []);

  const refresh = async () => {
    if (!player.current) return;

    const videoList = await getVideoList();

    setVideoList(videoList);
  };

  return (
    <div className="player-page">
      <div
        className="video-container"
        onMouseEnter={() => {
          setShowButton(true);
        }}
        onMouseLeave={() => {
          setShowButton(false);
        }}
      >
        {!showVideoList && showButton && (
          <div className="list-toggle">
            <Button onClick={toggle}>{t("expand")}</Button>
          </div>
        )}
        <div ref={playerRef} />
      </div>
      {showVideoList && (
        <div className="video-list">
          <List
            header={
              <Space.Compact block>
                <Button onClick={refresh}>{t("refresh")}</Button>
                <Button onClick={toggle}>{t("collapse")}</Button>
              </Space.Compact>
            }
            dataSource={videoList}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  if (!player.current) return;
                  player.current.src = item.url;
                }}
                title={item.name}
                className="video-list-item"
              >
                {item.name}
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
