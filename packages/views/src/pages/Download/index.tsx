import React, { FC, useCallback, useRef, useState } from "react";
import SplitPane from "react-split-pane";
import VirtualList from "rc-virtual-list";
import "./index.scss";
import { useSize } from "ahooks";
import { Button, Form, message, Dropdown, Menu, Space } from "antd";
import { useDropzone } from "react-dropzone";
import classNames from "classnames";
import { CloseOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import type { ProFormInstance } from "@ant-design/pro-components";
import {
  DrawerForm,
  ModalForm,
  ProForm,
  ProFormText,
} from "@ant-design/pro-components";

const waitTime = async (time: number = 100): Promise<boolean> => {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const menu = (
  <Menu
    onClick={() => {}}
    items={[
      {
        label: "1st menu item",
        key: "1",
        icon: <UserOutlined />,
      },
      {
        label: "2nd menu item",
        key: "2",
        icon: <UserOutlined />,
      },
      {
        label: "3rd menu item",
        key: "3",
        icon: <UserOutlined />,
      },
    ]}
  />
);

// 下载页
const Download: FC = () => {
  const downloadListRef = useRef(null);
  const downloadListSize = useSize(downloadListRef);
  const [task, setTask] = useState(0);
  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({ accept: { "image/*": [] }, noClick: true });
  const formRef = useRef<
    ProFormInstance<{
      name: string;
      company?: string;
      useMode?: string;
    }>
  >();
  const [form] = Form.useForm<{ name: string; company: string }>();

  // 下载列表
  const renderList = useCallback(() => {
    return (
      <div className={"download-list"}>
        <VirtualList
          data={Array(100)
            .fill(null)
            .map((_, index) => ({ email: index }))}
          height={downloadListSize?.height}
          itemHeight={30}
          itemKey="email"
        >
          {(item: any) => (
            <div
              className={"download-item"}
              onClick={() => {
                setTask(1);
              }}
            >
              <div className="status" />
              <div className="name">斗罗大陆斗罗大陆斗罗大陆</div>
              <Button type={"link"}>下载</Button>
            </div>
          )}
        </VirtualList>
      </div>
    );
  }, [downloadListSize, downloadListRef]);

  // 下载任务面板
  const renderTaskPanel = useCallback(() => {
    return (
      <div className={"task-panel"}>
        <div className="panel-header">
          <Button
            icon={<CloseOutlined />}
            shape={"circle"}
            onClick={() => {
              setTask(0);
            }}
          />
        </div>
        <ProForm<{
          name: string;
          company?: string;
          useMode?: string;
        }>
          onFinish={async (values) => {
            await waitTime(2000);
            console.log(values);
            const val1 = await formRef.current?.validateFields();
            console.log("validateFields:", val1);
            const val2 =
              await formRef.current?.validateFieldsReturnFormatValue?.();
            console.log("validateFieldsReturnFormatValue:", val2);
            await message.success("提交成功");
          }}
          formRef={formRef}
          params={{ id: "100" }}
          request={async () => {
            await waitTime(100);
            return {
              name: "蚂蚁设计有限公司",
              useMode: "chapter",
            };
          }}
          autoFocusFirstInput
        >
          <ProFormText
            width="md"
            name="company"
            label="视频名称"
            placeholder="请输入名称"
          />
          <ProFormText
            width="md"
            name="company"
            label="下载程序"
            placeholder="请输入名称"
          />
          <ProFormText
            width="md"
            name="company"
            label="请求地址"
            placeholder="请输入名称"
          />
          <ProFormText
            width="md"
            name="company"
            label="请求标头"
            placeholder="请输入名称"
          />
        </ProForm>
      </div>
    );
  }, [task]);

  // 下载页面的工具栏
  const renderToolbar = useCallback(() => {
    return (
      <div className={"toolbar"}>
        <div className="toolbar-left">
          <Space>
            <ModalForm<{
              name: string;
              company: string;
            }>
              title="新建表单"
              trigger={
                <Button type="primary">
                  <PlusOutlined />
                  新建表单
                </Button>
              }
              form={form}
              autoFocusFirstInput
              modalProps={{
                destroyOnClose: true,
                onCancel: () => console.log("run"),
              }}
              submitTimeout={2000}
              onFinish={async (values) => {
                await waitTime(2000);
                console.log(values.name);
                await message.success("提交成功");
                return true;
              }}
            >
              <ProFormText
                name="project"
                disabled
                label="项目名称"
                initialValue="xxxx项目"
              />
              <ProFormText
                width="xs"
                name="mangerName"
                disabled
                label="商务经理"
                initialValue="启途"
              />
            </ModalForm>
            <Dropdown.Button
              onClick={() => {
                console.log(123);
              }}
              overlay={menu}
            >
              Dropdown
            </Dropdown.Button>
          </Space>
        </div>
        <div className="toolbar-right">
          <Space>
            <DrawerForm<{
              name: string;
              company: string;
            }>
              width={"80%"}
              title="新建表单"
              form={form}
              trigger={
                <Button type="primary">
                  <PlusOutlined />
                  管理收藏
                </Button>
              }
              autoFocusFirstInput
              drawerProps={{
                destroyOnClose: true,
              }}
              submitTimeout={2000}
              onFinish={async (values) => {
                await waitTime(2000);
                console.log(values.name);
                await message.success("提交成功");
                // 不返回不会关闭弹框
                return true;
              }}
            >
              <ProForm.Group>
                <ProFormText
                  name="name"
                  width="md"
                  label="签约客户名称"
                  tooltip="最长为 24 位"
                  placeholder="请输入名称"
                />
              </ProForm.Group>
              <ProFormText width="sm" name="id" label="主合同编号" />
            </DrawerForm>
          </Space>
        </div>
      </div>
    );
  }, []);

  // 页尾
  const renderFooter = useCallback(() => {
    return <div className={"footer"}>footer</div>;
  }, []);

  return (
    <div
      className={classNames("download-page", {
        "file-drag": isDragAccept || isDragReject,
        "file-accept": isDragAccept,
        "file-reject": isDragReject,
      })}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {renderToolbar()}
      <div ref={downloadListRef} className="download-main">
        {task !== 0 ? (
          <SplitPane
            className={"split-pane"}
            minSize={350}
            maxSize={
              downloadListSize?.width ? downloadListSize.width - 30 : 500
            }
            split="vertical"
          >
            {renderList()}
            {renderTaskPanel()}
          </SplitPane>
        ) : (
          renderList()
        )}
      </div>
      {renderFooter()}
    </div>
  );
};

export default Download;
