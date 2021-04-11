import React from "react";
import { Col, Form, Input, Row } from "antd";

interface Props {}
interface State {}

class MediaGoForm extends React.Component<Props, State> {
  render() {
    return (
      <Form>
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              label="视频名称"
              name="name"
              rules={[{ required: true, message: "请填写视频名称" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="m3u8链接"
              name="url"
              rules={[{ required: true, message: "请填写 m3u8 链接" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
          label="请求标头"
          name="headers"
        >
          <Input />
        </Form.Item>
      </Form>
    );
  }
}

export default MediaGoForm;
