import {
  DeleteOutlined,
  FolderOpenOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { type Conversion } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import {
  App,
  Badge,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
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
import { useConversions } from "@/hooks/use-conversions";
import { usePlatform } from "@/hooks/use-platform";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const {
    data,
    isLoading,
    mutate,
    addConversion,
    deleteConversion,
    startConversion,
    stopConversion,
  } = useConversions({ current: page, pageSize });
  const { selectFile, openDir } = usePlatform();
  const { message } = App.useApp();
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [quality, setQuality] = useState("medium");
  const [filePath, setFilePath] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleBrowseFile = useMemoizedFn(async () => {
    try {
      const file = await selectFile();
      if (file) setFilePath(file);
    } catch (e: unknown) {
      message.error((e as Error).message);
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
      if (startImmediately && (conv as Record<string, unknown>)?.id) {
        await startConversion((conv as Record<string, unknown>).id);
      }
      setAddModalOpen(false);
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  });

  const handleStart = useMemoizedFn(async (id: number) => {
    tdApp.onEvent(START_CONVERT);
    try {
      await startConversion(id);
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  });

  const handleStop = useMemoizedFn(async (id: number) => {
    try {
      await stopConversion(id);
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  });

  const handleDelete = useMemoizedFn(async (id: number) => {
    tdApp.onEvent(DELETE_CONVERT);
    await deleteConversion(id);
  });

  const handleOpenFolder = useMemoizedFn(async (targetPath: string) => {
    try {
      const dir =
        targetPath.substring(0, targetPath.lastIndexOf("/")) ||
        targetPath.substring(0, targetPath.lastIndexOf("\\"));
      await openDir(dir || targetPath);
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
    await Promise.allSettled(pending.map((item) => startConversion(item.id)));
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
        {!isLoading && data?.list?.length === 0 && (
          <div className="flex h-full flex-1 flex-row items-center justify-center rounded-lg bg-white dark:bg-[#1F2024]">
            <Empty description={t("noData")} />
          </div>
        )}
        {!isLoading &&
          data?.list?.length &&
          data.list.length > 0 &&
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
                    status={
                      STATUS_COLORS[item.status] as
                        | "default"
                        | "processing"
                        | "success"
                        | "error"
                    }
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

      <Pagination
        className="flex justify-end"
        current={page}
        pageSize={pageSize}
        onChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        total={data?.total ?? 0}
      />
    </PageContainer>
  );
};

export default Converter;
