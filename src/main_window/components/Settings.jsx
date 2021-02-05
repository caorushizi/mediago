import React, { useState } from "react";
import {
  TextField,
  MaskedTextField,
  ChoiceGroup,
  Stack,
  Checkbox,
} from "@fluentui/react";
import PropTypes from "prop-types";
import "./Settings.scss";

const Settings = ({ dir, handleSelectDir }) => {
  const [bin, setBin] = useState("A");
  const handleChooseChange = (e, option) => {
    setBin(option.key);
  };

  const options = [
    {
      key: "A",
      text: "mediago",
      onRenderField: (props, render) => <div>{render(props)}</div>,
    },
    {
      key: "B",
      text: "N_m3u8DL-CLI",
      onRenderField: (props, render) => <div>{render(props)}</div>,
    },
  ];

  const renderSettingsPanel = () => (
    <Stack tokens={{ childrenGap: 5 }}>
      <TextField label="混流文件" value={dir} />
      <TextField label="自定义KEY" value={dir} />
      <TextField label="自定义IV" value={dir} />
      <MaskedTextField label="选择范围" mask="999:999:999 -- 999:999:999" />
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <Stack styles={{ root: { width: "30%" } }} tokens={{ childrenGap: 5 }}>
          <Checkbox label="合并后删除分片" />
          <Checkbox label="仅解析m3u8" />
          <Checkbox label="使用二进制合并" />
          <TextField label="最大线程" />
          <TextField label="超时时长(s)" />
        </Stack>
        <Stack styles={{ root: { width: "30%" } }} tokens={{ childrenGap: 5 }}>
          <Checkbox label="合并时不写入日期" />
          <Checkbox label="混流MP4边下边看" />
          <Checkbox label="仅合并音频轨道" />
          <TextField label="最小线程" />
          <TextField label="停速(kb/s)" />
        </Stack>
        <Stack styles={{ root: { width: "30%" } }} tokens={{ childrenGap: 5 }}>
          <Checkbox label="不使用系统代理" />
          <Checkbox label="下载完成后不合并" />
          <Checkbox label="关闭完整性检查" />
          <TextField label="重试次数" />
          <TextField label="限速(kb/s)" />
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <div className="settings">
      <TextField
        label="本地路径"
        required
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
        defaultSelectedKey="A"
        options={options}
        onChange={handleChooseChange}
        selectedKey={bin}
        label="请选择执行程序"
        required
      />
      {bin === "B" && renderSettingsPanel()}
    </div>
  );
};

Settings.propTypes = {
  dir: PropTypes.string.isRequired,
  handleSelectDir: PropTypes.func.isRequired,
};

export default Settings;
