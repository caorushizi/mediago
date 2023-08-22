import {
  ModalForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Form } from "antd";
import React, { FC } from "react";
import "./index.scss";

export interface DownloadFormProps {
  onFinish: (values: DownloadItem) => Promise<boolean | void>;
  trigger: JSX.Element;
  isEdit?: boolean;
  item?: DownloadItem;
}

const preProcessHeaders = (value: string | null) => {
  if (!value) return;

  let headers: Record<string, any> = {};
  try {
    headers = JSON.parse(value);
  } catch (err) {
    // empty
  }
  return Object.entries(headers)
    .map(([key, value]) => {
      return `${key}: ${value}`;
    })
    .join("\n");
};

const postProcessHeaders = (value: string | null) => {
  if (!value) return "";

  const headers = value
    .split("\n")
    .reduce<Record<string, any>>((prev, curr) => {
      const [key, value] = curr.split(":");
      if (key) {
        prev[key.trim()] = value ? value.trim() : "";
      }
      return prev;
    }, {});

  return JSON.stringify(headers);
};

const DownloadFrom: FC<DownloadFormProps> = ({
  onFinish,
  trigger,
  isEdit,
  item,
}) => {
  const [form] = Form.useForm<DownloadItem>();

  return (
    <ModalForm<DownloadItem>
      key={isEdit ? "edit" : "new"}
      title={isEdit ? "编辑下载" : "新建下载"}
      width={500}
      trigger={trigger}
      form={form}
      autoFocusFirstInput
      onOpenChange={() => {
        if (item) {
          // 处理 headers 字段
          const headers = preProcessHeaders(item.headers);

          form.setFieldsValue({
            ...item,
            headers,
          });
        }
      }}
      modalProps={{
        destroyOnClose: true,
        bodyStyle: {
          paddingTop: 5,
        },
      }}
      submitTimeout={2000}
      onFinish={(values) => {
        // 处理 headers 字段
        const headers = postProcessHeaders(values.headers);

        return onFinish({ ...values, headers });
      }}
      labelCol={{ span: 4 }}
      layout="horizontal"
      colon={false}
    >
      {!isEdit && <ProFormSwitch label="批量下载" name={"batch"} />}
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          if (!isEdit && form.getFieldValue("batch")) {
            return (
              <ProFormTextArea
                name="batchList"
                fieldProps={{
                  rows: 6,
                }}
                label="视频链接"
                placeholder={`请输入视频链接， 确保一行一个，格式： 视频链接 视频名称(非必填)， 例如
https://www.bilibili.com/video/XXX 哔哩哔哩视频
http://example.com/xxx.m3u8 m3u8视频
http://example.com/xxx.m3u8`}
                rules={[
                  {
                    required: true,
                    message: "请输入站点视频链接",
                  },
                ]}
              />
            );
          } else {
            return (
              <ProFormText
                name="url"
                label="视频链接"
                placeholder="请输入在线网络视频URL，或者将M3U8拖拽至此"
                rules={[
                  {
                    required: true,
                    message: "请输入在线网络视频URL",
                  },
                  {
                    pattern: /^(file|https?):\/\/.+/,
                    message: "请输入正确的视频链接",
                  },
                ]}
                fieldProps={{
                  onDrop: (e) => {
                    const file: any = e.dataTransfer.files[0];
                    form.setFieldValue("url", `file://${file.path}`);
                    form.validateFields(["url"]);
                  },
                }}
              />
            );
          }
        }}
      </Form.Item>
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          if (isEdit || !form.getFieldValue("batch")) {
            return (
              <ProFormText
                name="name"
                label="视频名称"
                placeholder="请输入视频名称，默认以当前时间作为视频名称"
              />
            );
          }
        }}
      </Form.Item>
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          if (isEdit || !form.getFieldValue("batch")) {
            return (
              <ProFormText
                name="name"
                label="私有KEY"
                placeholder="KEY和IV值（HEX格式）"
              />
            );
          }
        }}
      </Form.Item>
      <ProFormTextArea
        name="headers"
        label="附加标头"
        fieldProps={{
          rows: 4,
        }}
        placeholder={`请输入附加标头，确保一行一个 Header， 例如：
Origin: http://www.example.com
Referer: http://www.example.com`}
      />
    </ModalForm>
  );
};

export default DownloadFrom;
