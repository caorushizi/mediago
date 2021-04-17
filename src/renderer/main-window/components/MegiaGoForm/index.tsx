import React, { ReactNode } from "react";
import { Button, Form, FormInstance, Input, Modal, Switch } from "antd";
import { SourceItemForm } from "types/common";

interface Props {
  visible: boolean;
  handleDownload: (item: SourceItemForm) => Promise<void>;
  handleCancel: () => void;
  handleOk: (item: SourceItemForm) => Promise<void>;
}

interface State {}

class MediaGoForm extends React.Component<Props, State> {
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

  render(): ReactNode {
    const { visible, handleDownload, handleCancel } = this.props;
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
        <Form labelCol={{ span: 4 }} ref={this.formRef}>
          <Form.Item
            label="视频名称"
            name="title"
            rules={[{ required: true, message: "请填写视频名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="m3u8"
            name="url"
            rules={[{ required: true, message: "请填写 m3u8 链接" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="请求标头" name="headers">
            <Input />
          </Form.Item>
          <Form.Item
            label="下载完成是否删除"
            name="delete"
            labelCol={{ span: 8 }}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default MediaGoForm;
