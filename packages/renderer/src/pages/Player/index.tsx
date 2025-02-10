import { cn, http } from "@/utils";
import { UnorderedListOutlined } from "@ant-design/icons";
import { useAsyncEffect, useMemoizedFn } from "ahooks";
import { App, Drawer } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";

export default function PlayerPage() {
  const { message } = App.useApp();
  const player = useRef<Player>();
  const [videoList, setVideoList] = useState([]);
  const [currentVideo, setCurrentVideo] = useState("");
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useAsyncEffect(async () => {
    let url = "";
    try {
      const res = await http.get("http://localhost:3222/api");
      setVideoList(res.data);
      setCurrentVideo(res.data[0].url);
      url = res.data[0].url;
    } catch (e) {
      message.error(t("failToFetchVideoList"));
    } finally {
      player.current = new Player({
        id: "mse",
        height: "100%",
        width: "100%",
        lang: "zh-cn",
        url,
      });
    }
  }, []);

  const handleVideoClick = useMemoizedFn((url: string) => {
    setCurrentVideo(url);
    player.current.src = url;
    player.current.play();

    setOpen(false);
  });

  const onClose = useMemoizedFn(() => {
    setOpen(false);
  });

  const handleOpen = useMemoizedFn(() => {
    setOpen(true);
  });

  return (
    <div className="group relative flex h-full w-full dark:bg-[#141415]">
      <div
        className="absolute right-5 top-5 z-50 hidden cursor-pointer items-center rounded-sm border border-white px-1.5 py-0.5 text-center group-hover:block"
        onClick={handleOpen}
      >
        <UnorderedListOutlined className="text-white" />
      </div>
      <div id="mse" className="h-full w-full" />

      <Drawer
        title={t("playList")}
        placement={"right"}
        closable={false}
        onClose={onClose}
        open={open}
        key={"right"}
      >
        <ul className="flex flex-col gap-1">
          {videoList.map((video, index) => (
            <li
              className={cn(
                "m-2 line-clamp-2 cursor-pointer text-sm dark:text-white",
                {
                  "text-blue-500 dark:text-blue-500":
                    video.url === currentVideo,
                },
              )}
              key={index}
              onClick={() => handleVideoClick(video.url)}
            >
              {video.title}
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
