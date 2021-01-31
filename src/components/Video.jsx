import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.min.css";
import "./Video.scss";

class Video extends React.Component {
  componentDidMount() {
    // instantiate Video.js
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log("onPlayerReady", this);
    });
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    return (
      <div className="video">
        <div data-vjs-player>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={(node) => {
              this.videoNode = node;
            }}
            className="video-js"
          />
        </div>
      </div>
    );
  }
}

export default Video;
