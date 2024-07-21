import React, { useEffect } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";

export default function PlayerPage() {
  useEffect(() => {
    new Player({
      id: "mse",
      url: "//abc.com/**/*.mp4",
      fluid: true,
    });
  }, []);

  return <div id="mse" className="h-full w-full"></div>;
}
