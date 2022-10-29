import React, { FC, useCallback, useRef, useState } from "react";
import SplitPane from "react-split-pane";
import VirtualList from "rc-virtual-list";
import "./index.scss";
import { useRequest, useSize } from "ahooks";
import { Button, Dropdown, Form, Menu, message, Skeleton, Space } from "antd";
import { useDropzone } from "react-dropzone";
import classNames from "classnames";
import {
  AppstoreAddOutlined,
  CloseOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  ProFormDependency,
  ProFormInstance,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { getCollections, getVideoList } from "../../api";
import { wait } from "../../utils";
import dayjs from "dayjs";

// 下载页
const Download: FC = () => {
  const downloadListRef = useRef(null);
  const downloadListSize = useSize(downloadListRef);
  const [task, setTask] = useState<Video>();

  const formRef = useRef<ProFormInstance<Video>>();
  const [form] = Form.useForm<Video>();
  const [formOpen, setFormOpen] = useState(false);
  const { data: videoList, error, loading } = useRequest(getVideoList);
  const {
    data: collections,
    error: errors,
    loading: loading1,
  } = useRequest(getCollections);
  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept: { "image/*": [] },
      noClick: true,
      onDrop: (files, rejectFiles) => {
        // 默认取第一个
        const [file] = files;
        form.setFieldValue("url", file.path);
        form.validateFields(["url", "name"]);
        console.log(files, rejectFiles);
        setFormOpen(true);
      },
    });

  const menu = (
    <Menu
      onClick={() => {}}
      items={collections?.map((item) => ({
        label: item.title,
        key: item.id,
        icon: <LinkOutlined />,
      }))}
    />
  );

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
        <ProForm<Video> formRef={formRef} autoFocusFirstInput>
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
          <ModalForm<Video>
            title="新建表单"
            open={formOpen}
            trigger={
              <Button type="primary">
                <AppstoreAddOutlined />
                新建下载
              </Button>
            }
            form={form}
            onOpenChange={(open) => {
              setFormOpen(open);
            }}
            autoFocusFirstInput
            modalProps={{
              destroyOnClose: false,
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
              await wait(0.2);
              message.success("提交成功");
              return true;
            }}
            validateTrigger={"onBlur"}
            onValuesChange={async (values: Video) => {
              const name = form.getFieldValue("name");
              const { url } = values;
              if (!name && url) {
                const nameStr = dayjs().format("YYYY-MM-DD-HH-mm-ss");
                form.setFieldValue("name", nameStr);
                await form.validateFields(["name"]);
              }
            }}
          >
            <ProFormText
              name="url"
              label="视频链接"
              rules={[
                {
                  required: true,
                  message: "视频链接必填",
                },
                {
                  validator: async (rule, value) => {
                    return new URL(value);
                  },
                  message: "请输入一个正确的url",
                },
              ]}
            />
            <ProFormDependency name={["url"]}>
              {({ url }) => {
                console.log("url", url);
                return (
                  <ProFormText
                    name="name"
                    label="视频名称"
                    initialValue={url}
                    rules={[
                      {
                        required: true,
                        message: "视频名称必填",
                      },
                    ]}
                  />
                );
              }}
            </ProFormDependency>

            <ProFormTextArea name="headers" label="请求标头" />
          </ModalForm>
          <Dropdown.Button
            onClick={() => {
              console.log(123);
            }}
            overlay={menu}
          >
            打开浏览器
          </Dropdown.Button>
        </Space>
      </div>
    );
  }, [collections, formOpen]);

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
