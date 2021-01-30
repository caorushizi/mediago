import React from "react";
import "./Download.scss";

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.handleStartDownload = this.handleStartDownload.bind(this);
  }

  handleStartDownload() {
    console.log(this);
  }

  render() {
    return (
      <div className="download">
        <form className="form">
          <div className="form-item">
            <div className="form-item__label">视频名称：</div>
            <div className="form-item__inner">
              <input type="text" name="name" />
            </div>
          </div>

          <div className="form-item">
            <div className="form-item__label">m3u8 地址：</div>
            <div className="form-item__inner">
              <input type="text" name="url" />
            </div>
          </div>

          <div className="form-item">
            <button type="button" onClick={this.handleStartDownload}>
              开始下载
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default Download;
