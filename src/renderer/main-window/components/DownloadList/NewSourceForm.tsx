import React, { ReactNode } from "react";
import { Button, Form, FormInstance, Input, Modal, Switch } from "antd";
import { SourceItemForm } from "types/common";
import { AppStateContext } from "renderer/main-window/types";

interface Props {
  visible: boolean;
  handleDownload: (item: SourceItemForm) => Promise<void>;
  handleCancel: () => void;
  handleOk: (item: SourceItemForm) => Promise<void>;
}

const headersPlaceholder = `[可空] 请输入一行一个Header，例如：
Origin: https://www.sample.com
Referer: https://www.sample.com`;

class NewSourceForm extends React.Component<Props> {
  static contextType = AppStateContext;
  formRef = React.createRef<FormInstance<SourceItemForm>>();

  // 点击确定按钮
  handleOk = async (): Promise<void> => {
    const { handleOk } = this.props;

    const formRef = this.formRef.current;
    if (formRef && (await formRef.validateFields())) {
      const item = formRef.getFieldsValue();
      await handleOk(item);
      formRef.resetFields();
    }
  };

  // 点击确定按钮
  handleDownload = async (): Promise<void> => {
    const { handleDownload } = this.props;

    const formRef = this.formRef.current;
    if (formRef && (await formRef.validateFields())) {
      const item = formRef.getFieldsValue();
      await handleDownload(item);
      formRef.resetFields();
    }
  };

  // 文件拖入事件
  handleFileDrop = (e: React.DragEvent<HTMLInputElement>): void => {
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
    this.formRef.current?.setFieldsValue({ url: path });
  };

  render(): ReactNode {
    const { visible, handleCancel } = this.props;
    const { exeFile } = this.context;
    return (
      <Modal
        title="新建下载"
        visible={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={this.handleDownload}>
            立即下载
          </Button>,
          <Button key="submit" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="link" type="primary" onClick={this.handleOk}>
            添加
          </Button>,
        ]}
      >
        <Form
          labelCol={{ span: 4 }}
          ref={this.formRef}
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
  }
}

export default NewSourceForm;
