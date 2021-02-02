import React from "react";
import { TextField, PrimaryButton } from "@fluentui/react";
import PropTypes from "prop-types";
import "./Settings.scss";

const Settings = ({ dir, handleSelectDir }) => (
  <div className="settings">
    <TextField
      label="本地路径"
      required
      value={dir || "请选择文件夹"}
      onRenderSuffix={() => (
        <PrimaryButton onClick={handleSelectDir}>选择文件夹</PrimaryButton>
      )}
    />
  </div>
);

Settings.propTypes = {
  dir: PropTypes.string.isRequired,
  handleSelectDir: PropTypes.func.isRequired,
};

export default Settings;
