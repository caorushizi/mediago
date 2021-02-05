import React from "react";
import { TextField, ChoiceGroup } from "@fluentui/react";
import PropTypes from "prop-types";
import "./Settings.scss";

const Settings = ({ dir, handleSelectDir, exeFile, handleSelectExeFile }) => {
  const options = [
    {
      key: "mediago",
      text: "mediago",
      onRenderField: (props, render) => <div>{render(props)}</div>,
    },
    {
      key: "N_m3u8DL-CLI",
      text: "N_m3u8DL-CLI",
      onRenderField: (props, render) => <div>{render(props)}</div>,
    },
  ];

  return (
    <div className="settings">
      <TextField
        label="本地路径"
        required
        size="small"
        placeholder="请选择文件夹"
        value={dir}
        onRenderSuffix={() => (
          <div
            role="presentation"
            style={{ cursor: "pointer" }}
            onClick={handleSelectDir}
          >
            选择文件夹
          </div>
        )}
      />
      <ChoiceGroup
        options={options}
        onChange={handleSelectExeFile}
        selectedKey={exeFile}
        label="请选择执行程序"
        required
      />
    </div>
  );
};

Settings.propTypes = {
  dir: PropTypes.string.isRequired,
  handleSelectDir: PropTypes.func.isRequired,
  exeFile: PropTypes.string.isRequired,
  handleSelectExeFile: PropTypes.func.isRequired,
};

export default Settings;
