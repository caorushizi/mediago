import { useMount } from "ahooks";
import { List, NavBar } from "antd-mobile";
import { useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import { cn, http } from "./utils";

interface VideoSource {
  title: string;
  url: string;
}

function App() {
  const [data, setData] = useState<VideoSource[]>([]);
  const player = useRef<Player>();
  const [currentVideo, setCurrentVideo] = useState("");

  useMount(async () => {
    const { data } = await http.get<VideoSource[]>("/api");
    setData(data);

    let url = "";
    if (data.length > 0) {
      url = data[0].url;
      setCurrentVideo(url);
    }

    player.current = new Player({
      id: "mse",
      url: url,
      fluid: true,
      lang: "zh-cn",
    });
  });

  const handleVideoClick = (url: string) => {
    if (!player.current) return;
    setCurrentVideo(url);
    player.current.src = url;
    player.current?.play();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <NavBar back={null}>视频播放</NavBar>
      <div id="mse" />
      <List header="播放列表" className="flex-1 overflow-auto">
        {data.map((item) => {
          return (
            <List.Item
              onClick={() => handleVideoClick(item.url)}
              className={cn({
                "text-blue-500": item.url === currentVideo,
              })}
            >
              {item.title}
            </List.Item>
          );
        })}
      </List>
    </div>
  );
}

export default App;
