import React from "react";
import "./Download.scss";
import PropTypes from "prop-types";
import exec from "../exec";

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      url: "",
      err: "",
    };

    this.handleStartDownload = this.handleStartDownload.bind(this);
  }

  async handleStartDownload() {
    const { local } = this.props;
    const { name, url } = this.state;

    if (!name) {
      this.setState({ err: "请输入视频名称" });
      return;
    }

    if (!url) {
      this.setState({ err: "请输入 m3u8 地址" });
      return;
    }

    if (!local) {
      this.setState({ err: "错误" });
      return;
    }

    this.setState({ err: "" });

    const result = await exec(name, local, url);
    console.log("result : ", result);
    const { code, msg, data } = result;
    if (code === 0) {
      console.log("成功：", data);
    } else {
      console.log("出错");
      console.log(msg);
    }
  }

  render() {
    const { name, url, err } = this.state;
    return (
      <div className="download">
        <form className="form">
          <div className="form-item">
            <div className="form-item__label">视频名称：</div>
            <div className="form-item__inner">
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => {
                  this.setState({
                    name: e.target.value,
                  });
                }}
              />
            </div>
          </div>

          <div className="form-item">
            <div className="form-item__label">m3u8 地址：</div>
            <div className="form-item__inner">
              <input
                type="text"
                name="url"
                value={url}
                onChange={(e) => {
                  this.setState({ url: e.target.value });
                }}
              />
            </div>
          </div>

          <div className="form-item">
            <button type="button" onClick={this.handleStartDownload}>
              开始下载
            </button>
            <span style={{ color: "red" }}>{err}</span>
          </div>
        </form>
      </div>
    );
  }
}

Download.propTypes = {
  local: PropTypes.string.isRequired,
};

export default Download;
