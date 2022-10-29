import React, { FC, useEffect, useRef } from "react";
import {
  ProForm,
  ProFormDependency,
  ProFormSwitch,
  ProFormText,
  ProFormSelect,
  ProField,
  ProFormList,
  ProFormItem,
} from "@ant-design/pro-components";
import { Button, FormInstance, Space, Switch, Tooltip } from "antd";
import { FolderOpenOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import "./index.scss";
import { useRequest } from "ahooks";
import { getConfig } from "../../api";

const statisticsTooltip = `
是否允许统计用户数据
1. 统计数据不会用于商业用途，仅仅用于优化用户体验
2. 关闭用户统计依然会收集打开页面的次数，但不会收集任何自定义数据
3. 软件会统计页面报错，以便排查错误，请谅解~
`;

const Settings: FC = () => {
  const { data: config, error, loading } = useRequest(getConfig);
  const formRef = useRef<FormInstance<Config>>();

  useEffect(() => {
    if (config != null) {
      formRef?.current?.setFieldsValue(config);
    }
  }, [config]);

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
      <ProForm<Config>
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        colon={false}
        initialValues={{}}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 20 }}
        onValuesChange={() => {}}
      >
        <ProFormText
          disabled
          name="download_path"
          placeholder="请选择视频下载目录"
          label={
            <Button onClick={handleSelectDir} icon={<FolderOpenOutlined />}>
              选择文件夹
            </Button>
          }
        />
        <ProFormSwitch label="下载完成提示" name="audible_alarm" />
        <ProFormText
          name="proxy"
          placeholder="请填写代理地址"
          label="代理设置"
        />
        <ProFormSwitch
          name={"proxy_enable"}
          tooltip={"该代理会对软件自带浏览器以及下载时生效"}
          label={"代理开关"}
        >
          <Switch />
        </ProFormSwitch>
        <ProFormSwitch
          tooltip={statisticsTooltip}
          label={"允许打点统计"}
          name="allow_statistics"
        />
        <ProFormSelect
          allowClear={false}
          name="download_program"
          label="默认下载器"
          placeholder="请选择执行程序"
          options={[]}
        />
        <ProFormItem
          label={"更多操作"}
          // name={["executable_file_path", "download_program", "proxy_enable"]}
          style={{ marginBottom: 0 }}
        >
          <Space>
            <ProForm.Item name={"executable_file_path"}>
              <Button onClick={openConfigDir} icon={<FolderOpenOutlined />}>
                配置文件
              </Button>
            </ProForm.Item>
            <ProForm.Item name={"executable_file_path"}>
              <Button onClick={openConfigDir} icon={<FolderOpenOutlined />}>
                配置文件
              </Button>
            </ProForm.Item>
            <ProForm.Item name={"executable_file_path"}>
              <Button onClick={openConfigDir} icon={<FolderOpenOutlined />}>
                配置文件
              </Button>
            </ProForm.Item>
          </Space>
        </ProFormItem>
        <ProForm.Item label={"当前版本"} name={"version"}>
          <ProField mode={"read"} />
        </ProForm.Item>
      </ProForm>
    </div>
  );
};

export default Settings;
