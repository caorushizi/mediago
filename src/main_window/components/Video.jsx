import React from "react";
import { List } from "@fluentui/react";
import "./Video.scss";
import axios from "axios";

import Player from "xgplayer";
import "xgplayer-mp4";

class Video extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      videoList: [],
    };
  }

  async componentDidMount() {
    const resp = await axios.get("http://127.0.0.1:7789/");
    this.setState({
      videoList: resp.data,
    });

    // instantiate Video.js
    this.player = new Player({
      id: "mse",
      url: [],
      playsinline: true,
      whitelist: [""],
      fluid: true,
      volume: 0.5,
      playbackRate: [0.5, 1, 1.5, 2],
      pip: true,
      keyShortcut: "on",
      videoInit: true,
      lang: "zh-cn",
    });
  }

  render() {
    const { videoList } = this.state;
    return (
      <div className="video">
        <div className="video-inner">
          <div id="mse" />
        </div>
        <div className="video-playlist">
          <List
            items={videoList}
            onRenderCell={(item) => (
              <div
                role="presentation"
                onClick={() => {
                  const mediaUrl = `http://127.0.0.1:7789/${item}`;
                  this.player.start(mediaUrl);
                }}
                className="video-item"
                key={item}
              >
                {item}
              </div>
            )}
          />
        </div>
      </div>
    );
  }
}

export default Video;
