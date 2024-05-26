import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Form, Input, InputNumber, Select, Space } from "antd";
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

const EpisodeNumber: FC<EpisodeNumberProps> = ({
  value = "",
  onChange = () => {},
  canChangeType,
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState("teleplay");
  const [name, setName] = useState("");
  const [number, setNumber] = useState(1);
  const isEpisode = useMemo(() => type === "teleplay", [type]);

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
      onOpenChange,
      onAddToList,
      onDownloadNow,
      item,
    } = props;
    const [form] = Form.useForm<DownloadItem>();
    const { t } = useTranslation();

    useEffect(() => {
      form.setFieldsValue(item);
    }, [item]);

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
        <Form.Item noStyle shouldUpdate>
          {(form) => {
            if (!form.getFieldValue("batch")) {
              return (
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
                <Form.Item
                  shouldUpdate
                  name="name"
                  label={t("videoName")}
                  tooltip={
                    form.getFieldValue("type") === "m3u8" &&
                    t("canUseMouseWheelToAdjust")
                  }
                >
                  <EpisodeNumber
                    canChangeType={form.getFieldValue("type") === "m3u8"}
                  />
                </Form.Item>
              );
            }
          }}
        </Form.Item>
        <Form.Item noStyle shouldUpdate>
          {(form) => {
            if (
              (isEdit || !form.getFieldValue("batch")) &&
              form.getFieldValue("type") === "m3u8"
            ) {
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
    );
  }
);

export default DownloadForm;
