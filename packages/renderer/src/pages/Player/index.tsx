import { cn, http } from "@/utils";
import { useAsyncEffect } from "ahooks";
import React, { useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";

export default function PlayerPage() {
  const player = useRef<Player>();
  const [videoList, setVideoList] = useState([]);
  const [currentVideo, setCurrentVideo] = useState("");

  useAsyncEffect(async () => {
    const res = await http.get("http://localhost:3222/api");
    setVideoList(res.data);
    setCurrentVideo(res.data[0].url);

    player.current = new Player({
      id: "mse",
      height: "100%",
      width: "100%",
      lang: "zh-cn",
      url: res.data[0].url,
    });
  }, []);

  const handleVideoClick = (url: string) => {
    setCurrentVideo(url);
    player.current.src = url;
    player.current.play();
  };

  return (
    <div className="flex h-full w-full dark:bg-[#141415]">
      <div id="mse" className="h-full w-3/4"></div>
      <div className="w-1/4 overflow-y-auto">
        <ul>
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
      </div>
    </div>
  );
}
