import React, { useRef } from "react";
import PageContainer from "../../components/PageContainer";
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormGroup,
  ProFormSwitch,
} from "@ant-design/pro-components";
import "./index.scss";
import { Button, FormInstance, Space, Switch, Tooltip } from "antd";
import { FolderOpenOutlined, QuestionCircleOutlined } from "@ant-design/icons";

interface Settings {
  workapce: string;
}

const renderTooltipLable = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <div style={{ marginRight: "5px" }}>代理开关</div>
      <Tooltip
        title={"该代理会对软件自带浏览器以及下载时生效"}
        placement={"right"}
      >
        <QuestionCircleOutlined />
      </Tooltip>
    </div>
  );
};

const renderButtonLable = () => {
  return (
    <Button
      onClick={() => {
        // empty
      }}
      icon={<FolderOpenOutlined />}
    >
      选择文件夹
    </Button>
  );
};

const SettingPage: React.FC = () => {
  const formRef = useRef<FormInstance<Settings>>();
  const settings = {};
  return (
    <PageContainer title="设置">
      <ProForm<Settings>
        className={"setting-form-inner"}
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        labelCol={{ style: { width: "130px" } }}
        labelAlign={"left"}
        size={"small"}
        colon={false}
        initialValues={settings}
        onValuesChange={async () => {
          // empty
        }}
      >
        <ProFormGroup title="基础设置" direction={"vertical"}>
          <ProFormText
            width="xl"
            disabled
            name="workspace"
            placeholder="请选择视频下载目录"
            label={renderButtonLable()}
          />
          <ProFormSwitch label="下载完成提示" name="tip" />
          <ProFormText
            width="xl"
            name="proxy"
            placeholder="请填写代理地址"
            label="代理设置"
          />
          <ProFormSwitch name="useProxy" label={renderTooltipLable()} />
          <ProFormSwitch name="statistics" label={renderTooltipLable()} />
        </ProFormGroup>
        <ProFormGroup title="下载设置" direction={"vertical"}>
          <ProFormSelect
            allowClear={false}
            width="xl"
            name="exeFile"
            label="默认下载器"
            placeholder="请选择执行程序"
            options={[]}
          />
          <ProFormText label="更多操作">
            <Space>
              <Button
                onClick={() => {
                  // empty
                }}
                icon={<FolderOpenOutlined />}
              >
                配置文件目录
              </Button>
              <Button
                onClick={() => {
                  // empty
                }}
                icon={<FolderOpenOutlined />}
              >
                可执行程序目录
              </Button>
              <Button
                onClick={() => {
                  // empty
                }}
                icon={<FolderOpenOutlined />}
              >
                本地存储目录
              </Button>
            </Space>
          </ProFormText>
          <ProFormText label="当前版本">
            <div>1.0.0</div>
          </ProFormText>
        </ProFormGroup>
      </ProForm>
    </PageContainer>
  );
};

export default SettingPage;
