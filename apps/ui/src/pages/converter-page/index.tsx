import {
  DeleteOutlined,
  FolderOpenOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { type Conversion, GET_CONVERSIONS } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import {
  App,
  Badge,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Button as AntButton,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/icon-button";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADD_CONVERT_TASK, DELETE_CONVERT, START_CONVERT } from "@/const";
import { tdApp } from "@/utils";
import useAPI from "@/hooks/use-api";
import useSWR from "swr";
import Loading from "@/components/loading";

const FORMAT_OPTIONS = [
  {
    label: "Video",
    options: [
      { label: "MP4", value: "mp4" },
      { label: "MKV", value: "mkv" },
      { label: "WebM", value: "webm" },
    ],
  },
  {
    label: "Audio",
    options: [
      { label: "MP3", value: "mp3" },
      { label: "AAC", value: "aac" },
      { label: "FLAC", value: "flac" },
      { label: "WAV", value: "wav" },
    ],
  },
];

const QUALITY_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "default",
  converting: "processing",
  done: "success",
  failed: "error",
};

const Converter = () => {
  const { t } = useTranslation();
  const {
    selectFile,
    getConversions,
    addConversion,
    deleteConversion,
    startConversion,
    stopConversion,
    openDir,
  } = useAPI();
  const { message } = App.useApp();
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [quality, setQuality] = useState("medium");
  const [filePath, setFilePath] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data, mutate, isLoading } = useSWR(
    {
      key: GET_CONVERSIONS,
      args: { current: 1, pageSize: 500 },
    },
    ({ args }) => getConversions(args),
    {
      refreshInterval: (latestData: any) => {
        const list = latestData?.list;
        if (
          Array.isArray(list) &&
          list.some((item: Conversion) => item.status === "converting")
        ) {
          return 1000;
        }
        return 0;
      },
    },
  );

  const handleBrowseFile = useMemoizedFn(async () => {
    try {
      const file = await selectFile();
      if (file) setFilePath(file);
    } catch (e: any) {
      message.error(e.message);
    }
  });

  const handleOpenModal = useMemoizedFn(() => {
    setFilePath("");
    setAddModalOpen(true);
  });

  const doAddConversion = useMemoizedFn(async (startImmediately: boolean) => {
    if (!filePath) {
      message.warning(t("pleaseSelectFile"));
      return;
    }
    try {
      const name = filePath.split(/[/\\]/).pop() || filePath;
      const conv = await addConversion({
        name,
        path: filePath,
        outputFormat,
        quality,
      });
      tdApp.onEvent(ADD_CONVERT_TASK);
      if (startImmediately && conv?.id) {
        await startConversion(conv.id);
      }
      setAddModalOpen(false);
      mutate();
    } catch (e: any) {
      message.error(e.message);
    }
  });

  const handleStart = useMemoizedFn(async (id: number) => {
    tdApp.onEvent(START_CONVERT);
    try {
      await startConversion(id);
      mutate();
    } catch (e: any) {
      message.error(e.message);
    }
  });

  const handleStop = useMemoizedFn(async (id: number) => {
    try {
      await stopConversion(id);
      mutate();
    } catch (e: any) {
      message.error(e.message);
    }
  });

  const handleDelete = useMemoizedFn(async (id: number) => {
    tdApp.onEvent(DELETE_CONVERT);
    await deleteConversion(id);
    mutate();
  });

  const handleOpenFolder = useMemoizedFn(async (filePath: string) => {
    try {
      const dir =
        filePath.substring(0, filePath.lastIndexOf("/")) ||
        filePath.substring(0, filePath.lastIndexOf("\\"));
      await openDir(dir || filePath);
    } catch {
      // ignore
    }
  });

  const handleConvertAll = useMemoizedFn(async () => {
    if (!data?.list) return;
    const pending = data.list.filter(
      (item: Conversion) =>
        item.status === "pending" || item.status === "failed",
    );
    for (const item of pending) {
      try {
        await startConversion(item.id);
      } catch {
        // continue with next
      }
    }
    mutate();
  });

  const renderActions = useMemoizedFn((item: Conversion) => {
    switch (item.status) {
      case "converting":
        return (
          <div title={t("stop")} onClick={() => handleStop(item.id)}>
            <IconButton icon={<PauseOutlined />} />
          </div>
        );
      case "done":
        return (
          <>
            {item.outputPath && (
              <div
                title={t("openFolder")}
                onClick={() => handleOpenFolder(item.outputPath)}
              >
                <IconButton icon={<FolderOpenOutlined />} />
              </div>
            )}
            <div title={t("delete")} onClick={() => handleDelete(item.id)}>
              <IconButton icon={<DeleteOutlined />} />
            </div>
          </>
        );
      default:
        return (
          <>
            <div title={t("start")} onClick={() => handleStart(item.id)}>
              <IconButton icon={<CaretRightOutlined />} />
            </div>
            <div title={t("delete")} onClick={() => handleDelete(item.id)}>
              <IconButton icon={<DeleteOutlined />} />
            </div>
          </>
        );
    }
  });

  const hasPending =
    data?.list?.some(
      (item: Conversion) =>
        item.status === "pending" || item.status === "failed",
    ) ?? false;

  return (
    <PageContainer
      title={t("converter")}
      rightExtra={
        <Space>
          {hasPending && (
            <Button variant="outline" onClick={handleConvertAll}>
              {t("convertAll")}
            </Button>
          )}
          <Button onClick={handleOpenModal}>{t("addFile")}</Button>
        </Space>
      }
      className="rounded-lg bg-white dark:bg-[#1F2024] flex"
    >
      <Modal
        title={t("addFile")}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={
          <Space>
            <Button
              key="add"
              variant="outline"
              onClick={() => doAddConversion(false)}
            >
              {t("addToList")}
            </Button>
            <Button key="convert" onClick={() => doAddConversion(true)}>
              {t("convertNow")}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item label={t("filePath")}>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={filePath}
                readOnly
                placeholder={t("pleaseSelectFile")}
              />
              <AntButton onClick={handleBrowseFile}>{t("browse")}</AntButton>
            </Space.Compact>
          </Form.Item>
          <Form.Item label={t("outputFormat")}>
            <Select
              value={outputFormat}
              onChange={setOutputFormat}
              options={FORMAT_OPTIONS}
            />
          </Form.Item>
          <Form.Item label={t("quality")}>
            <Select
              value={quality}
              onChange={setQuality}
              options={QUALITY_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>

      <div className="flex flex-col gap-3 rounded-lg bg-white p-3 dark:bg-[#1F2024] flex-1 overflow-auto">
        {isLoading && <Loading />}
        {!isLoading && data?.list.length === 0 && (
          <div className="flex h-full flex-1 flex-row items-center justify-center rounded-lg bg-white dark:bg-[#1F2024]">
            <Empty description={t("noData")} />
          </div>
        )}
        {!isLoading &&
          data?.list?.length &&
          data?.list?.length > 0 &&
          data.list.map((item: Conversion) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg bg-[#FAFCFF] p-3 dark:bg-[#27292F]"
            >
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <span className="text-sm text-[#343434] dark:text-[#B4B4B4]">
                    {item.name}
                  </span>
                  <Badge
                    status={STATUS_COLORS[item.status] as any}
                    text={
                      <span className="text-xs">
                        {item.status === "converting"
                          ? `${item.progress}%`
                          : item.status}
                      </span>
                    }
                  />
                  {item.outputFormat && (
                    <span className="text-xs text-[#AAB5CB]">
                      → .{item.outputFormat}
                    </span>
                  )}
                </div>
                <div className="flex flex-row gap-3">{renderActions(item)}</div>
              </div>
              {item.status === "converting" && (
                <Progress
                  percent={item.progress}
                  size="small"
                  showInfo={false}
                />
              )}
              <div className="text-xs text-[#AAB5CB]">
                {item.status === "done" && item.outputPath
                  ? item.outputPath
                  : item.path}
              </div>
              {item.status === "failed" && item.error && (
                <div className="text-xs text-red-500">{item.error}</div>
              )}
            </div>
          ))}
      </div>
    </PageContainer>
  );
};

export default Converter;
