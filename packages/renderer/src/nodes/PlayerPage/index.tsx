import React, { FC, useEffect, useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import "./index.scss";
import axios from "axios";
import { useAsyncEffect, useToggle } from "ahooks";
import { List, Space, Button } from "antd";
import useElectron from "../../hooks/electron";

interface Video {
  id: number;
  url: string;
  name: string;
}

const port = import.meta.env.APP_SERVER_PORT;

// 播放器页面
const PlayerPage: FC = () => {
  const { rendererEvent, removeEventListener, getLocalIP } = useElectron();
  const [showVideoList, { toggle }] = useToggle();
  const [showButton, setShowButton] = useState(false);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const playerRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player>();
  const playedVideoId = useRef<number>();

  // 获取视频列表
  const getVideoList = async (): Promise<Video[]> => {
    const localIP = await getLocalIP();

    const videoListUrl = `http://${localIP}:${port}/api/video-list`;
    const res = await axios.get(videoListUrl);
    return res.data;
  };

  useAsyncEffect(async () => {
    if (!playerRef.current) return;
    if (player.current) return;

    const videoList = await getVideoList();
    setVideoList(videoList);

    if (!Array.isArray(videoList) || videoList.length === 0) return;
    let src = videoList[0].url;
    if (playedVideoId.current) {
      const video = videoList.find((item) => item.id === playedVideoId.current);
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

  // 打开播放器窗口的时候播放的视频id
  const openPlayerWindow = async (e: any, videoId: number) => {
    playedVideoId.current = videoId;

    if (!player.current) return;

    const videoList = await getVideoList();
    setVideoList(videoList);
    const vc = videoList?.find((item) => item.id === videoId)?.url || "";
    player.current.src = vc;
  };

  const refresh = async () => {
    if (!player.current) return;

    const videoList = await getVideoList();

    setVideoList(videoList);
  };

  useEffect(() => {
    rendererEvent("open-player-window", openPlayerWindow);

    return () => {
      removeEventListener("open-player-window", openPlayerWindow);
    };
  }, []);

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
            <Button onClick={toggle}>展开</Button>
          </div>
        )}
        <div ref={playerRef} />
      </div>
      {showVideoList && (
        <div className="video-list">
          <List
            header={
              <Space.Compact block>
                <Button onClick={refresh}>刷新</Button>
                <Button onClick={toggle}>收起</Button>
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
