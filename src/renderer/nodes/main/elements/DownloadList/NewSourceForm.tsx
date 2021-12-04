import React, { FC, useRef } from "react";
import { Button, Form, FormInstance, Input, Modal, Switch } from "antd";
import { SourceItemForm } from "types/common";
import { useSelector } from "react-redux";
import { AppState } from "renderer/store/reducers";
import { Settings } from "renderer/store/models/settings";

interface Props {
  visible: boolean;
  handleDownload: (item: SourceItemForm) => Promise<void>;
  handleCancel: () => void;
  handleOk: (item: SourceItemForm) => Promise<void>;
}

const headersPlaceholder = `[可空] 请输入一行一个Header，例如：
Origin: https://www.sample.com
Referer: https://www.sample.com`;

const NewSourceForm: FC<Props> = ({
  handleOk,
  handleDownload,
  handleCancel,
  visible,
}) => {
  const formRef = useRef<FormInstance<SourceItemForm>>();
  const settings = useSelector<AppState, Settings>((state) => state.settings);

  const { exeFile } = settings;

  // 点击确定按钮
  const handleConfirm = async (): Promise<void> => {
    if (formRef.current && (await formRef.current.validateFields())) {
      const item = formRef.current.getFieldsValue();
      await handleOk(item);
      formRef.current.resetFields();
    }
  };

  // 点击确定按钮
  const handleDownload1 = async (): Promise<void> => {
    if (formRef.current && (await formRef.current.validateFields())) {
      const item = formRef.current.getFieldsValue();
      await handleDownload(item);
      formRef.current.resetFields();
    }
  };

  // 文件拖入事件
  const handleFileDrop = (e: React.DragEvent<HTMLInputElement>): void => {
    e.preventDefault();

    const dataTransfer = e.dataTransfer;
    if (
      !dataTransfer ||
      !dataTransfer.files ||
      dataTransfer.files.length === 0
    ) {
      return;
    }
    const path = dataTransfer.files[0].path;
    formRef.current?.setFieldsValue({ url: path });
  };

  return (
    <Modal
      title="新建下载"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleDownload1}>
          立即下载
        </Button>,
        <Button key="submit" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="link" type="primary" onClick={handleConfirm}>
          添加
        </Button>,
      ]}
    >
      <Form
        labelCol={{ span: 4 }}
        ref={formRef}
        initialValues={{ delete: true }}
      >
        <Form.Item
          label="m3u8"
          name="url"
          rules={[{ required: true, message: "请填写 m3u8 链接" }]}
        >
          <Input placeholder="[必填] 输入 m3u8 地址，或将M3U8文件拖拽至此" />
        </Form.Item>
        <Form.Item
          label="视频名称"
          name="title"
          rules={[{ required: true, message: "请填写视频名称" }]}
        >
          <Input placeholder="[可空] 默认当前时间戳" />
        </Form.Item>
        <Form.Item label="请求标头" name="headers">
          <Input.TextArea rows={3} placeholder={headersPlaceholder} />
        </Form.Item>
        <Form.Item
          label="下载完成是否删除"
          name="delete"
          labelCol={{ span: 8 }}
          valuePropName="checked"
        >
          <Switch disabled={exeFile === "mediago"} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewSourceForm;
