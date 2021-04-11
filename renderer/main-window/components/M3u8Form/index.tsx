import React from "react";
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  TimePicker,
} from "antd";

interface Props {}
interface State {}

class M3u8Form extends React.Component<Props, State> {
  render() {
    return (
      <Form
        colon={false}
        className="form-inner"
        onFinish={this.onFinish}
        ref={this.formRef}
        size="small"
        initialValues={{
          maxThreads: 32,
          minThreads: 16,
          retryCount: 15,
          timeOut: 10,
          stopSpeed: 0,
          maxSpeed: 0,
        }}
      >
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
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item label="请求标头" name="headers">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="BASEURL" name="baseUrl">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="混流文件" name="muxSetJson">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="设置代理" name="proxyAddress">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="自定义KEY" name="useKeyBase64">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="自定义IV" name="useKeyIV">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="范围选择" name="downloadRange">
              <TimePicker.RangePicker />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ span: 24 }} name="checkbox">
          <Checkbox.Group>
            <Row gutter={[16, 10]}>
              <Col span={8}>
                <Checkbox value="enableDelAfterDone">合并后删除分片</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="disableDateInfo">合并时不写入日期</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="noProxy">不使用系统代理</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="enableParseOnly">仅解析m3u8</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="enableMuxFastStart ">混流MP4边下边看</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="noMerge ">下载完成后不合并</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="enableBinaryMerge ">使用二进制合并</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="enableAudioOnly ">仅合并音频轨道</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="disableIntegrityCheck ">
                  关闭完整性检查
                </Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="最大线程"
              name="maxThreads"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="最小线程"
              name="minThreads"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="重试次数"
              name="retryCount"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="超时时长(s)"
              name="timeOut"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="停速(kb/s)"
              name="stopSpeed"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              label="限速(kb/s)"
              name="maxSpeed"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default M3u8Form;
