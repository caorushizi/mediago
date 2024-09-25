import { Button, Form, Input, Modal, Select, Switch, message } from "antd";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import TextArea from "antd/es/input/TextArea";
import { ConfigStore, useConfigStore } from "@/store/config";
import { useShallow } from "zustand/react/shallow";
import { useMemoizedFn } from "ahooks";
import { DownloadType } from "@/types";
import { EpisodeNumber } from "./EpisodeNumber";

export interface DownloadFormType {
  batch?: boolean;
  batchList?: string;
  name?: string;
  type?: DownloadType;
  headers?: string;
  url?: string;
  id?: number;
}

export interface DownloadFormProps {
  isEdit?: boolean;
  usePrevData?: boolean;
  destroyOnClose?: boolean;
  onAddToList: (values: DownloadFormType) => Promise<boolean | void>;
  onDownloadNow: (values: DownloadFormType) => Promise<boolean | void>;
  onFormVisibleChange?: (open: boolean) => void;
}

export interface DownloadFormRef {
  setFieldsValue: (value: DownloadFormType) => void;
  getFieldsValue: () => DownloadFormType;
  openModal: (value: DownloadFormType) => void;
}

export interface DownloadItemForm extends DownloadItem {
  batch?: boolean;
  batchList?: string;
}

const configSelector = (s: ConfigStore) => ({
  setLastDownloadTypes: s.setLastDownloadTypes,
  setLastIsBatch: s.setLastIsBatch,
});

export default forwardRef<DownloadFormRef, DownloadFormProps>(
  function DownloadForm(
    {
      isEdit,
      destroyOnClose,
      onAddToList,
      onDownloadNow,
      usePrevData,
      onFormVisibleChange,
    },
    ref,
  ) {
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm<DownloadFormType>();
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const { setLastDownloadTypes, setLastIsBatch } = useConfigStore(
      useShallow(configSelector),
    );

    useImperativeHandle(ref, () => {
      return {
        openModal: (value) => {
          form.setFieldsValue(value);
          setModalOpen(true);
        },
        setFieldsValue: (value) => {
          form.setFieldsValue(value);
        },
        getFieldsValue: () => {
          return form.getFieldsValue();
        },
      };
    }, []);

    const handleValuesChange = useMemoizedFn((values: any) => {
      const { type, batch } = values;
      if (type) {
        setLastDownloadTypes(type);
      }
      if (batch != null) {
        setLastIsBatch(batch);
      }
    });

    const handleAfterClose = useMemoizedFn((open: boolean) => {
      onFormVisibleChange?.(open);
    });

    const handleSubmit = useMemoizedFn(async () => {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        const close = await onAddToList(values);
        if (close) {
          setModalOpen(false);
        }
      } catch (e: any) {
        console.error(e);
        messageApi.error(e?.message || t("pleaseEnterCorrectFomeInfo"));
      }
    });

    const handleDownloadNow = useMemoizedFn(async () => {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        const close = await onDownloadNow(values);
        if (close) {
          setModalOpen(false);
        }
      } catch (e: any) {
        console.error(e);
        messageApi.error(e?.message || t("pleaseEnterCorrectFomeInfo"));
      }
    });

    return (
      <>
        {contextHolder}
        <Modal
          open={modalOpen}
          key={isEdit ? "edit" : "new"}
          title={isEdit ? t("editDownload") : t("newDownload")}
          width={500}
          onClose={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
          afterOpenChange={handleAfterClose}
          destroyOnClose={destroyOnClose}
          footer={[
            <Button key="cancel" onClick={() => setModalOpen(false)}>
              {t("cancel")}
            </Button>,
            <Button key="submit" onClick={handleSubmit}>
              {t("addToDownloadList")}
            </Button>,
            <Button key="link" type="primary" onClick={handleDownloadNow}>
              {t("downloadNow")}
            </Button>,
          ]}
        >
          <Form
            form={form}
            autoFocus
            labelCol={{ span: 5 }}
            layout="horizontal"
            colon={false}
            onValuesChange={handleValuesChange}
          >
            {!isEdit && (
              <Form.Item label={t("batchDownload")} name={"batch"}>
                <Switch />
              </Form.Item>
            )}
            <Form.Item
              key="type"
              name="type"
              label={t("videoType")}
              rules={[
                {
                  required: true,
                  message: t("pleaseEnterVideoName"),
                },
              ]}
            >
              <Select
                disabled={isEdit}
                options={[
                  {
                    label: t("streamMedia"),
                    value: "m3u8",
                  },
                  {
                    label: t("bilibiliMedia"),
                    value: "bilibili",
                  },
                ]}
                placeholder={t("pleaseSelectVideoType")}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {(form) => {
                const isBatch = form.getFieldValue("batch");
                const isM3u8 = form.getFieldValue("type") === "m3u8";
                if (isBatch) {
                  return null;
                }

                const canChangeType = isM3u8;
                return (
                  <Form.Item
                    shouldUpdate
                    name="name"
                    label={t("videoName")}
                    rules={[
                      {
                        required: true,
                        message: t("pleaseEnterCorrectFomeInfo"),
                      },
                    ]}
                    tooltip={canChangeType && t("canUseMouseWheelToAdjust")}
                  >
                    <EpisodeNumber
                      canChangeType={canChangeType}
                      isEdit={isEdit}
                      usePrevData={usePrevData}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {() => {
                if (!isEdit && form.getFieldValue("batch")) {
                  return (
                    <Form.Item
                      label={t("videoLink")}
                      name="batchList"
                      required
                      rules={[
                        {
                          required: true,
                          message: t("pleaseEnterVideoLink"),
                        },
                        {
                          validator: (_, value) => {
                            const lines = value.split("\n");
                            for (const line of lines) {
                              const params = line.trim().split(" ");
                              if (params.length > 2) {
                                return Promise.reject(
                                  new Error(t("pleaseEnterCorrectBatchList")),
                                );
                              }
                              const [url] = params;
                              if (!/^(https?):\/\/.+/.test(url)) {
                                return Promise.reject(
                                  new Error(t("pleaseEnterCorrectBatchList")),
                                );
                              }
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <TextArea
                        rows={5}
                        placeholder={t("videoLikeDescription")}
                      />
                    </Form.Item>
                  );
                }
              }}
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {(form) => {
                if (isEdit || !form.getFieldValue("batch")) {
                  return (
                    <Form.Item
                      name="url"
                      label={t("videoLink")}
                      required
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
                    >
                      <Input
                        placeholder={t(
                          "pleaseEnterOnlineVideoUrlOrDragM3U8Here",
                        )}
                        onDrop={(e) => {
                          const file: any = e.dataTransfer.files[0];
                          form.setFieldValue("url", `file://${file.path}`);
                          form.validateFields(["url"]);
                        }}
                      />
                    </Form.Item>
                  );
                }
              }}
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {() => {
                if (
                  form.getFieldValue("type") === "m3u8" ||
                  form.getFieldValue("batch")
                ) {
                  return (
                    <Form.Item label={t("additionalHeaders")} name="headers">
                      <TextArea
                        rows={4}
                        placeholder={t("additionalHeadersDescription")}
                      />
                    </Form.Item>
                  );
                }
              }}
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  },
);
