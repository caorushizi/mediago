import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Form, Input, InputNumber, Select, Space, message } from "antd";
import React, {
  ChangeEvent,
  FC,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import "./index.scss";
import { useTranslation } from "react-i18next";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";

export interface DownloadFormProps {
  trigger?: JSX.Element;
  isEdit?: boolean;
  item?: DownloadItem;
  open?: boolean;
  destroyOnClose?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAddToList: (values: DownloadItem) => Promise<boolean | void>;
  onDownloadNow: (values: DownloadItem) => Promise<boolean | void>;
}

export interface DownloadFormRef {
  setFieldsValue: (value: Partial<DownloadItem>) => void;
  getFieldsValue: () => DownloadItem;
}

interface EpisodeNumberProps {
  value?: string;
  onChange?: (value: string) => void;
  canChangeType: boolean;
}

export interface DownloadItemForm extends DownloadItem {
  batch?: boolean;
  batchList?: string;
}

const EpisodeNumber: FC<EpisodeNumberProps> = ({
  value = "",
  onChange = () => {},
  canChangeType,
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState("teleplay");
  const [name, setName] = useState("");
  const [number, setNumber] = useState(1);
  const isEpisode = useMemo(
    () => type === "teleplay" && canChangeType,
    [type, canChangeType]
  );

  // FIXME: localforage
  // await localforage.setItem<NumberOfEpisodes>("numberOfEpisodes", {
  //   numberOfEpisodes,
  //   teleplay,
  // });

  const parseName = (value: string = "") => {
    const res = {
      name: "",
      number: 1,
    };

    if (/_第(\d+)集$/.test(value)) {
      const [, name, number] = value.match(/(.*?)_第(\d+)集$/);
      res.name = name;
      res.number = Number(number);
    } else {
      res.name = value;
    }

    return res;
  };

  useEffect(() => {
    const { name, number } = parseName(value);
    setName(name);
    setNumber(number);
    if (isEpisode) {
      onChange(`${name}_第${number}集`);
    }
  }, [value]);

  useEffect(() => {
    if (!name || !number) return;
    if (isEpisode) {
      onChange(`${name}_第${number}集`);
    } else {
      onChange(name);
    }
  }, [type]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (isEpisode) {
      onChange(`${e.target.value}_第${number}集`);
    } else {
      onChange(e.target.value);
    }
  };

  const onNumberChange = (val: number) => {
    setNumber(val);
    if (isEpisode) {
      onChange(`${name}_第${val}集`);
    }
  };

  return (
    <Space.Compact block>
      {canChangeType && (
        <Select
          style={{ width: 100 }}
          defaultValue="teleplay"
          options={[
            {
              label: "剧集",
              value: "teleplay",
            },
            {
              label: "电影",
              value: "movie",
            },
          ]}
          value={type}
          onChange={setType}
        />
      )}
      <Input
        value={name}
        onChange={handleNameChange}
        placeholder={t("pleaseEnterVideoName")}
      />
      {canChangeType && isEpisode && (
        <InputNumber
          style={{ width: 300 }}
          addonBefore="第"
          addonAfter="集"
          changeOnWheel
          value={number}
          min={1}
          onChange={onNumberChange}
        />
      )}
    </Space.Compact>
  );
};

const DownloadForm = forwardRef<DownloadFormRef, DownloadFormProps>(
  (props, ref) => {
    const {
      trigger,
      isEdit,
      open,
      destroyOnClose,
      onOpenChange,
      onAddToList,
      onDownloadNow,
      item,
    } = props;
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm<DownloadItem>();
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
      setModalOpen(open);
    }, [open]);

    useEffect(() => {
      if (modalOpen) {
        form.setFieldsValue(item);
      }
    }, [item, modalOpen]);

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

    const renderTrigger = () => {
      if (!trigger) {
        return null;
      }

      return React.cloneElement(trigger, {
        onClick: () => {
          setModalOpen(true);
        },
      });
    };

    return (
      <>
        {renderTrigger()}
        <ModalForm<DownloadItemForm>
          open={modalOpen}
          key={isEdit ? "edit" : "new"}
          title={isEdit ? t("editDownload") : t("newDownload")}
          width={500}
          form={form}
          autoFocusFirstInput
          submitter={{
            render: () => {
              return [
                <Button
                  key="addToList"
                  onClick={async () => {
                    try {
                      await form.validateFields();
                      const values = form.getFieldsValue();
                      const close = await onAddToList(values);
                      if (close) {
                        setModalOpen(false);
                      }
                    } catch (e: any) {
                      messageApi.error(e?.message);
                    }
                  }}
                  icon={<PlusOutlined />}
                >
                  {t("addToDownloadList")}
                </Button>,
                <Button
                  key="downloadNow"
                  type="primary"
                  onClick={async () => {
                    try {
                      await form.validateFields();
                      const values = form.getFieldsValue();
                      const close = await onDownloadNow(values);
                      if (close) {
                        setModalOpen(false);
                      }
                    } catch (e: any) {
                      messageApi.error(e?.message);
                    }
                  }}
                  icon={<DownloadOutlined />}
                >
                  {t("downloadNow")}
                </Button>,
              ];
            },
          }}
          onOpenChange={(open) => {
            if (onOpenChange) {
              onOpenChange(open);
            } else {
              setModalOpen(open);
            }
          }}
          modalProps={{
            destroyOnClose,
            styles: {
              body: {
                paddingTop: 5,
              },
            },
          }}
          submitTimeout={2000}
          labelCol={{ span: 5 }}
          layout="horizontal"
          colon={false}
        >
          {contextHolder}
          {!isEdit && (
            <ProFormSwitch label={t("batchDownload")} name={"batch"} />
          )}
          <ProFormSelect
            key="type"
            width="xl"
            disabled={isEdit}
            name="type"
            label={t("videoType")}
            valueEnum={{
              m3u8: "流媒体视频（m3u8）",
              bilibili: "哔哩哔哩视频",
            }}
            placeholder={t("pleaseSelectVideoType")}
            rules={[
              {
                required: true,
              },
            ]}
          />
          <Form.Item noStyle shouldUpdate>
            {(form) => {
              const canChangeType =
                !form.getFieldValue("batch") &&
                form.getFieldValue("type") === "m3u8";
              return (
                <Form.Item
                  shouldUpdate
                  name="name"
                  label={t("videoName")}
                  rules={[
                    {
                      required: true,
                      message: t("pleaseEnterVideoName"),
                    },
                  ]}
                  tooltip={canChangeType && t("canUseMouseWheelToAdjust")}
                >
                  <EpisodeNumber canChangeType={canChangeType} />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {(form) => {
              if (!isEdit && form.getFieldValue("batch")) {
                return (
                  <ProFormTextArea
                    name="batchList"
                    fieldProps={{
                      rows: 4,
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
              if (
                form.getFieldValue("type") === "m3u8" ||
                form.getFieldValue("batch")
              ) {
                return (
                  <ProFormTextArea
                    name="headers"
                    label={t("additionalHeaders")}
                    fieldProps={{
                      rows: 4,
                    }}
                    placeholder={t("additionalHeadersDescription")}
                  />
                );
              }
            }}
          </Form.Item>
        </ModalForm>
      </>
    );
  }
);

export default DownloadForm;
