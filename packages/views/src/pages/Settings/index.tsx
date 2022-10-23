import React, { FC, useRef } from "react";
import {
  ProForm,
  ProFormGroup,
  ProFormSwitch,
  ProFormText,
  ProFormSelect,
} from "@ant-design/pro-components";
import { Button, FormInstance, Space, Switch, Tooltip } from "antd";
import { FolderOpenOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import "./index.scss";

const statisticsTooltip = `
是否允许统计用户数据
1. 统计数据不会用于商业用途，仅仅用于优化用户体验
2. 关闭用户统计依然会收集打开页面的次数，但不会收集任何自定义数据
3. 软件会统计页面报错，以便排查错误，请谅解~
`;

const Settings: FC = () => {
  const formRef = useRef<FormInstance>();

  // 选择下载地址
  const handleSelectDir = (): void => {};

  // 打开配置文件文件夹
  const openConfigDir = (): void => {};

  // 打开可执行程序文件夹
  const openBinDir = (): void => {};

  // 本地存储文件夹
  const localDir = (): void => {};

  return (
    <div className={"settings"}>
      <ProForm<any>
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        labelCol={{ style: { width: "130px" } }}
        labelAlign={"left"}
        size={"small"}
        colon={false}
        initialValues={{}}
        onValuesChange={() => {}}
      >
        <ProFormGroup label="基础设置" direction={"vertical"}>
          <ProFormText
            width="xl"
            disabled
            name="workspace"
            placeholder="请选择视频下载目录"
            label={
              <Button onClick={handleSelectDir} icon={<FolderOpenOutlined />}>
                选择文件夹
              </Button>
            }
          />
          <ProFormSwitch label="下载完成提示" name="tip" />
          <ProFormText
            width="xl"
            name="proxy"
            placeholder="请填写代理地址"
            label="代理设置"
          />
          <ProFormSwitch
            name={"useProxy"}
            label={
              <div>
                <div>代理开关</div>
                <Tooltip
                  title={"该代理会对软件自带浏览器以及下载时生效"}
                  placement={"right"}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </div>
            }
          >
            <Switch />
          </ProFormSwitch>
          <ProFormSwitch
            label={
              <div>
                <div>允许打点统计</div>
                <Tooltip title={statisticsTooltip} placement={"right"}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </div>
            }
            name="statistics"
          />
        </ProFormGroup>
        <ProFormGroup label="下载设置" direction={"vertical"}>
          <ProFormSelect
            allowClear={false}
            width="xl"
            name="exeFile"
            label="默认下载器"
            placeholder="请选择执行程序"
            options={[]}
          />
          <ProForm.Item label={"更多操作"}>
            <Space>
              <Button onClick={openConfigDir} icon={<FolderOpenOutlined />}>
                配置文件目录
              </Button>
              <Button onClick={openBinDir} icon={<FolderOpenOutlined />}>
                可执行程序目录
              </Button>
              <Button onClick={localDir} icon={<FolderOpenOutlined />}>
                本地存储目录
              </Button>
            </Space>
          </ProForm.Item>
          <ProForm.Item label={"当前版本"}>
            <div>{123}</div>
          </ProForm.Item>
        </ProFormGroup>
      </ProForm>
    </div>
  );
};

export default Settings;
