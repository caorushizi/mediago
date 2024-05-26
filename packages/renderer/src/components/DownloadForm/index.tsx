import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Form } from "antd";
import React, { forwardRef, useImperativeHandle } from "react";
import "./index.scss";
import { useTranslation } from "react-i18next";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";

export interface DownloadFormProps {
  trigger?: JSX.Element;
  isEdit?: boolean;
  item?: DownloadItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAddToList: (values: DownloadItem) => Promise<boolean | void>;
  onDownloadNow: (values: DownloadItem) => Promise<boolean | void>;
}

export interface DownloadFormRef {
  setFieldsValue: (value: Partial<DownloadItem>) => void;
  getFieldsValue: () => DownloadItem;
}

const DownloadForm = forwardRef<DownloadFormRef, DownloadFormProps>(
  (props, ref) => {
    const { trigger, isEdit, open, onOpenChange, onAddToList, onDownloadNow } =
      props;
    const [form] = Form.useForm<DownloadItem>();
    const { t } = useTranslation();

    useImperativeHandle(
      ref,
      () => {
        return {
          setFieldsValue: (value) => {
            form.setFieldsValue(value);
          },
          getFieldsValue: () => {
            return form.getFieldsValue();
          },
        };
      },
      []
    );

    return (
      <ModalForm<DownloadItem>
        open={open}
        key={isEdit ? "edit" : "new"}
        title={isEdit ? t("editDownload") : t("newDownload")}
        width={500}
        trigger={trigger}
        form={form}
        autoFocusFirstInput
        submitter={{
          render: () => {
            return [
              <Button
                key="addToList"
                onClick={async () => {
                  await form.validateFields();
                  const values = form.getFieldsValue();
                  return onAddToList(values);
                }}
                icon={<PlusOutlined />}
              >
                {t("addToDownloadList")}
              </Button>,
              <Button
                key="downloadNow"
                type="primary"
                onClick={async () => {
                  await form.validateFields();
                  const values = form.getFieldsValue();
                  return onDownloadNow(values);
                }}
                icon={<DownloadOutlined />}
              >
                {t("downloadNow")}
              </Button>,
            ];
          },
        }}
        onOpenChange={onOpenChange}
        modalProps={{
          destroyOnClose: true,
          styles: {
            body: {
              paddingTop: 5,
            },
          },
        }}
        submitTimeout={2000}
        labelCol={{ span: 4 }}
        layout="horizontal"
        colon={false}
      >
        {
          // <Tabs
          //   onChange={(key) => {
          //     const item = downloadItems.find((item) => item.url === key);
          //     if (item) {
          //       setCurrentDownloadForm(item);
          //     }
          //   }}
          //   items={downloadItems.map((item) => ({
          //     key: item.url,
          //     label: item.name,
          //   }))}
          // />
        }
        {!isEdit && <ProFormSwitch label={t("batchDownload")} name={"batch"} />}
        <ProFormSelect
          width="xl"
          name="type"
          label={t("videoType")}
          disabled
          placeholder={t("pleaseSelectVideoType")}
        />
        <Form.Item noStyle shouldUpdate>
          {(form) => {
            if (form.getFieldValue("type") !== "bilibili") {
              return (
                <ProFormSwitch
                  label={t("showNumberOfEpisodes")}
                  name="teleplay"
                />
              );
            }
          }}
        </Form.Item>
        <Form.Item noStyle shouldUpdate>
          {(form) => {
            if (
              form.getFieldValue("type") !== "bilibili" &&
              form.getFieldValue("teleplay")
            ) {
              return (
                <ProFormDigit
                  label={t("numberOfEpisodes")}
                  tooltip={t("canUseMouseWheelToAdjust")}
                  name="numberOfEpisodes"
                  width="xl"
                  min={1}
                  max={10000}
                  fieldProps={{
                    changeOnWheel: true,
                  }}
                />
              );
            }
          }}
        </Form.Item>
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
  }
);

export default DownloadForm;
