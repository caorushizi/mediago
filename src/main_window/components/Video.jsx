import React from "react";
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
          {videoList.map((video) => (
            <button
              type="button"
              onClick={() => {
                this.player.src({
                  type: "video/mp4",
                  src: `http://127.0.0.1:7789/${video}`,
                });
                this.player.ready(() => {
                  console.log("准备好了");
                  // tech() will error with no argument
                  // const tech = this.player.tech({
                  //   IWillNotUseThisInPlugins: true,
                  // });
                });
              }}
              className="video-item"
              key={video}
            >
              {video}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default Video;
