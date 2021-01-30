import React from "react";
import PropTypes from "prop-types";
import "./Setting.scss";

const Settings = ({ dir, handleSelectDir }) => (
  <div className="settings">
    <form className="form">
      <div className="form-item">
        <div className="form-item__label">本地路径：</div>
        <div className="form-item__inner">
          {dir || "请选择文件夹"}
          <button type="button" onClick={handleSelectDir}>
            选择文件夹
          </button>
        </div>
      </div>
    </form>
  </div>
);

Settings.propTypes = {
  dir: PropTypes.string.isRequired,
  handleSelectDir: PropTypes.func.isRequired,
};

export default Settings;
