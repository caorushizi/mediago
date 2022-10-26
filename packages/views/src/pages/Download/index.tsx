import React, { FC, useCallback, useRef, useState } from "react";
import SplitPane from "react-split-pane";
import VirtualList from "rc-virtual-list";
import "./index.scss";
import { useRequest, useSize } from "ahooks";
import { Button, Form, message, Dropdown, Menu, Space, Skeleton } from "antd";
import { useDropzone } from "react-dropzone";
import classNames from "classnames";
import { CloseOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import type { ProFormInstance } from "@ant-design/pro-components";
import { ModalForm, ProForm, ProFormText } from "@ant-design/pro-components";
import { getVideoList } from "../../api";
import { wait } from "../../utils";

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
  const [task, setTask] = useState<Video>();
  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({ accept: { "image/*": [] }, noClick: true });
  const formRef = useRef<ProFormInstance<Video>>();
  const [form] = Form.useForm<{ name: string; company: string }>();
  const { data: videoList, error, loading } = useRequest(getVideoList);

  // 下载列表
  const renderList = useCallback(() => {
    return (
      <div className={"download-list"}>
        <VirtualList<Video>
          data={videoList != null ? videoList : []}
          height={downloadListSize?.height}
          itemHeight={30}
          itemKey="email"
        >
          {(item) => (
            <div
              className={classNames("download-item", {
                active: task?.id === item.id,
              })}
              onClick={() => {
                setTask(item);
                formRef?.current?.setFieldsValue(item);
              }}
            >
              <div className="status" />
              <div className="name">{item.name}</div>
              <Button type={"link"}>下载</Button>
            </div>
          )}
        </VirtualList>
      </div>
    );
  }, [downloadListSize, downloadListRef, task, videoList]);

  // 下载任务面板
  const renderTaskPanel = useCallback(() => {
    return (
      <div className={"task-panel"}>
        <div className="panel-header">
          <Button
            icon={<CloseOutlined />}
            shape={"circle"}
            onClick={() => {
              setTask(undefined);
            }}
          />
        </div>
        <ProForm<Video>
          // onFinish={async (values) => {
          //   await waitTime(2000);
          //   console.log(values);
          //   const val1 = await formRef.current?.validateFields();
          //   console.log("validateFields:", val1);
          //   const val2 =
          //     await formRef.current?.validateFieldsReturnFormatValue?.();
          //   console.log("validateFieldsReturnFormatValue:", val2);
          //   await message.success("提交成功");
          // }}
          formRef={formRef}
          // params={task}
          // request={async () => {
          //   await waitTime(100);
          //   return task;
          // }}
          autoFocusFirstInput
        >
          <ProFormText name="name" label="视频名称" placeholder="请输入名称" />
          <ProFormText
            name="company"
            label="下载程序"
            placeholder="请输入名称"
          />
          <ProFormText name="url" label="请求地址" placeholder="请输入名称" />
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
              await wait(2);
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
        <Skeleton loading={loading} active>
          {task != null ? (
            <SplitPane
              className={"split-pane"}
              minSize={350}
              maxSize={
                downloadListSize?.width != null
                  ? downloadListSize.width - 30
                  : 500
              }
              split="vertical"
            >
              {renderList()}
              {renderTaskPanel()}
            </SplitPane>
          ) : (
            renderList()
          )}
        </Skeleton>
      </div>
      {renderFooter()}
    </div>
  );
};

export default Download;
