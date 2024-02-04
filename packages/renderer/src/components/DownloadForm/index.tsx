import {
  ModalForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Form } from "antd";
import React, { FC } from "react";
import "./index.scss";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <ModalForm<DownloadItem>
      key={isEdit ? "edit" : "new"}
      title={isEdit ? t("editDownload") : t("newDownload")}
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
        styles: {
          body: {
            paddingTop: 5,
          },
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
      {!isEdit && <ProFormSwitch label={t("batchDownload")} name={"batch"} />}
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          if (!isEdit && form.getFieldValue("batch")) {
            return (
              <ProFormTextArea
                name="batchList"
                fieldProps={{
                  rows: 6,
                }}
                label={t("videoLink")}
                placeholder={t("videoLikeDescription")}
                rules={[
                  {
                    required: true,
                    message: t("pleaseEnterVideoLink"),
                  },
                ]}
              />
            );
          } else {
            return (
              <ProFormText
                name="url"
                label={t("videoLink")}
                placeholder={t("pleaseEnterOnlineVideoUrlOrDragM3U8Here")}
                rules={[
                  {
                    required: true,
                    message: t("pleaseEnterOnlineVideoUrl"),
                  },
                  {
                    pattern: /^(file|https?):\/\/.+/,
                    message: t("pleaseEnterCorrectVideoLink"),
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
                label={t("videoName")}
                placeholder={t("pleaseEnterVideoName")}
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
                name="key"
                label={t("privateKey")}
                placeholder={t("keyAndIv")}
              />
            );
          }
        }}
      </Form.Item>
      <ProFormTextArea
        name="headers"
        label={t("additionalHeaders")}
        fieldProps={{
          rows: 4,
        }}
        placeholder={t("additionalHeadersDescription")}
      />
    </ModalForm>
  );
};

export default DownloadFrom;
