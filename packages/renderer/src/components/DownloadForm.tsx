import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import React, {
  ChangeEvent,
  FC,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import TextArea from "antd/es/input/TextArea";

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
    [type, canChangeType],
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
  function DownloadForm(props, ref) {
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

    useImperativeHandle(ref, () => {
      return {
        setFieldsValue: (value) => {
          form.setFieldsValue(value);
        },
        getFieldsValue: () => {
          return form.getFieldsValue();
        },
      };
    }, []);

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
        {contextHolder}
        {renderTrigger()}
        <Modal
          open={modalOpen}
          key={isEdit ? "edit" : "new"}
          title={isEdit ? t("editDownload") : t("newDownload")}
          width={500}
          onClose={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
          afterOpenChange={(open) => onOpenChange?.(open)}
          destroyOnClose={destroyOnClose}
          footer={[
            <Button
              key="submit"
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
            >
              {t("addToDownloadList")}
            </Button>,
            <Button
              key="link"
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
            >
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
                },
              ]}
            >
              <Select
                disabled={isEdit}
                options={[
                  {
                    label: "流媒体视频（m3u8）",
                    value: "m3u8",
                  },
                  {
                    label: "哔哩哔哩视频",
                    value: "bilibili",
                  },
                ]}
                placeholder={t("pleaseSelectVideoType")}
              />
            </Form.Item>
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
              {() => {
                if (!isEdit && form.getFieldValue("batch")) {
                  return (
                    <Form.Item
                      label={t("videoLink")}
                      required
                      rules={[
                        {
                          required: true,
                          message: t("pleaseEnterVideoLink"),
                        },
                      ]}
                    >
                      <TextArea
                        name="batchList"
                        rows={4}
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

export default DownloadForm;
