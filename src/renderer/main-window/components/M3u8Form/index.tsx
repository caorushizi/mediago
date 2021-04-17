import React, { ReactNode } from "react";
import { Checkbox, Col, Row, Form, Input, InputNumber, TimePicker } from "antd";

interface Props {}

interface State {}

class M3u8Form extends React.Component<Props, State> {
  render(): ReactNode {
    return (
      <Form
        colon={false}
        className="form-inner"
        labelCol={{ span: 6 }}
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
        <Form.Item label="BASEURL" name="baseUrl">
          <Input />
        </Form.Item>
        <Form.Item label="混流文件" name="muxSetJson">
          <Input />
        </Form.Item>
        <Form.Item label="设置代理" name="proxyAddress">
          <Input />
        </Form.Item>
        <Form.Item label="自定义KEY" name="useKeyBase64">
          <Input />
        </Form.Item>
        <Form.Item label="自定义IV" name="useKeyIV">
          <Input />
        </Form.Item>
        <Form.Item label="范围选择" name="downloadRange">
          <TimePicker.RangePicker />
        </Form.Item>
        <Form.Item wrapperCol={{ span: 24 }} name="checkbox">
          <Checkbox.Group>
            <Row>
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
        <Row>
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
