import React from "react";
import { List } from "@fluentui/react";
import videojs from "video.js";
import "video.js/dist/video-js.min.css";
import "./Video.scss";
import axios from "axios";

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
    this.player = videojs(
      this.videoNode,
      {
        controls: true,
        autoplay: false,
        preload: "auto",
        width: 100,
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2],
      },
      function onPlayerReady() {
        console.log("onPlayerReady", this);
      }
    );
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    const { videoList } = this.state;
    return (
      <div className="video">
        <div className="video-inner">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={(node) => {
              this.videoNode = node;
            }}
            className="video-js"
          />
        </div>
        <div className="video-playlist">
          <List
            items={videoList}
            onRenderCell={(item) => (
              <div
                role="presentation"
                onClick={() => {
                  this.player.src({
                    type: "video/mp4",
                    src: `http://127.0.0.1:7789/${item}`,
                  });
                  this.player.ready(() => {
                    console.log("准备好了");
                  });
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
