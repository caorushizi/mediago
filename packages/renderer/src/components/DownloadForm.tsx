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
import { ConfigStore, useConfigStore } from "@/store/config";
import { useShallow } from "zustand/react/shallow";
import { useMemoizedFn } from "ahooks";

export interface DownloadFormProps {
  trigger?: JSX.Element;
  isEdit?: boolean;
  usePrevData?: boolean;
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
  isEdit?: boolean;
  usePrevData?: boolean;
}

export interface DownloadItemForm extends DownloadItem {
  batch?: boolean;
  batchList?: string;
}

const videoTypeSelector = (s: ConfigStore) => ({
  lastVideoType: s.lastVideoType,
  lastVideoName: s.lastVideoName,
  lastVideoNumber: s.lastVideoNumber,
  setLastVideo: s.setLastVideo,
});

const EpisodeNumber: FC<EpisodeNumberProps> = ({
  value = "",
  onChange = () => {},
  canChangeType,
  usePrevData,
}) => {
  const { lastVideoName, lastVideoNumber, lastVideoType, setLastVideo } =
    useConfigStore(useShallow(videoTypeSelector));
  const { t } = useTranslation();
  const [type, setType] = useState("teleplay");
  const [name, setName] = useState("");
  const [number, setNumber] = useState(1);
  const isEpisode = useMemo(
    () => type === "teleplay" && canChangeType,
    [type, canChangeType],
  );

  /**
   * 初始化
   * 三个地方会使用到这个组件
   * 1. 新建下载： value 为空
   * 2. 编辑下载： value 有值，编辑模式， 可以使用 canChangeType 判断是否为编辑模式
   * 3. 视频嗅探： value 有值，但是不是编辑模式
   */
  useEffect(() => {
    // 如果没有，使用上次的值
    if (!value) {
      const name = lastVideoName || "";
      const number = lastVideoNumber || 1;
      const type = lastVideoType || "teleplay";

      setName(name);
      setNumber(number);
      setType(type);

      if (type === "teleplay" && canChangeType) {
        onChange(`${name}_第${number}集`);
      } else {
        onChange(name);
      }

      return;
    }

    // 解析名称
    const parseName = (value: string = "") => {
      const res = {
        name: "",
        number: 1,
        isTelePlay: false,
      };

      if (/_第(\d+)集$/.test(value)) {
        const [, name, number] = value.match(/(.*?)_第(\d+)集$/);
        res.name = name;
        res.number = Number(number);
        res.isTelePlay = true;
      } else {
        res.name = value;
      }

      return res;
    };
    const { name, number, isTelePlay } = parseName(value);

    if (usePrevData) {
      setName(name);
      setNumber(lastVideoNumber);
      setType(lastVideoType);

      if (lastVideoType === "teleplay" && canChangeType) {
        onChange(`${name}_第${lastVideoNumber}集`);
      } else {
        onChange(name);
      }
      return;
    }

    setName(name);
    setNumber(number);
    setType(isTelePlay ? "teleplay" : "movie");

    if (isTelePlay && canChangeType) {
      onChange(`${name}_第${number}集`);
    } else {
      onChange(name);
    }
  }, [value]);

  const handleNameChange = useMemoizedFn((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setLastVideo({ name: e.target.value });

    if (isEpisode) {
      onChange(`${e.target.value}_第${number}集`);
    } else {
      onChange(e.target.value);
    }
  });

  const onNumberChange = useMemoizedFn((val: number) => {
    setNumber(val);
    setLastVideo({ number: val });

    if (isEpisode) {
      onChange(`${name}_第${val}集`);
    }
  });

  const handleChangeType = useMemoizedFn((type: string) => {
    setLastVideo({ type });
    setType(type);

    if (type === "teleplay") {
      onChange(`${name}_第${number}集`);
    } else {
      onChange(name);
    }
  });

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
          onChange={handleChangeType}
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

const configSelector = (s: ConfigStore) => ({
  lastDownloadTypes: s.lastDownloadTypes,
  setLastDownloadTypes: s.setLastDownloadTypes,
});

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
      usePrevData,
    } = props;
    const [modalOpen, setModalOpen] = useState(open);
    const [form] = Form.useForm<DownloadItem>();
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const { setLastDownloadTypes, lastDownloadTypes } = useConfigStore(
      useShallow(configSelector),
    );

    useEffect(() => {
      setModalOpen(open);
    }, [open]);

    useEffect(() => {
      if (modalOpen && item) {
        form.setFieldsValue({
          ...item,
          type: lastDownloadTypes,
        });
      } else {
        form.setFieldsValue({ type: lastDownloadTypes });
      }
    }, [modalOpen]);

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

    const handleValuesChange = useMemoizedFn(
      (values: Partial<DownloadItem>) => {
        const { type } = values;
        if (type) {
          setLastDownloadTypes(type);
        }
      },
    );

    const handleAfterClose = useMemoizedFn((open: boolean) =>
      onOpenChange?.(open),
    );

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
        {renderTrigger()}
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
