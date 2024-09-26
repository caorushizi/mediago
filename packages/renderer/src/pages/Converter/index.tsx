import React, { ReactNode, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Empty, message } from "antd";
import useElectron from "../../hooks/electron";
import { useMemoizedFn, usePagination } from "ahooks";
import { getFileName, tdApp } from "../../utils";
import { Conversion } from "../../../../main/types/entity/Conversion";
import { DeleteOutlined, SyncOutlined } from "@ant-design/icons";
import { produce } from "immer";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/IconButton";
import { ADD_CONVERT_TASK, DELETE_CONVERT, START_CONVERT } from "@/const";

const Converter = () => {
  const { t } = useTranslation();
  const {
    selectFile,
    getConversions,
    addConversion,
    convertToAudio,
    deleteConversion,
  } = useElectron();
  const [messageApi, contextHolder] = message.useMessage();
  const [converting, setConverting] = useState<Record<number, boolean>>({});

  const { data, refresh } = usePagination(
    ({ current, pageSize }) => {
      return getConversions({
        current,
        pageSize,
      });
    },
    {
      defaultPageSize: 50,
      refreshDeps: [],
    },
  );

  const onClickConvertToAudio = useMemoizedFn(async (item: Conversion) => {
    const nextState = produce((draft) => {
      draft[item.id] = true;
    });
    setConverting(nextState);
    tdApp.onEvent(START_CONVERT);
    try {
      await convertToAudio(item.id);
      messageApi.success(t("convertSuccess"));
    } catch (e: any) {
      messageApi.error(e.message);
    } finally {
      const nextState = produce((draft) => {
        draft[item.id] = false;
      });
      setConverting(nextState);
    }
  });

  const onDeleteConversion = useMemoizedFn(async (id: number) => {
    tdApp.onEvent(DELETE_CONVERT);
    await deleteConversion(id);
    refresh();
  });

  const renderActionButtons = (dom: ReactNode, item: Conversion): ReactNode => {
    // 下载成功
    return [
      <div
        key="convert"
        title={t("convertToAudio")}
        onClick={() => onClickConvertToAudio(item)}
      >
        <IconButton icon={<SyncOutlined spin={converting[item.id]} />} />
      </div>,
      <div
        key="delete"
        title={t("delete")}
        onClick={() => onDeleteConversion(item.id)}
      >
        <IconButton icon={<DeleteOutlined />} />
      </div>,
    ];
  };

  const handleSelectFile = useMemoizedFn(async () => {
    const file = await selectFile();
    await addConversion({
      name: getFileName(file),
      path: file,
    });
    refresh();
    tdApp.onEvent(ADD_CONVERT_TASK);
  });

  return (
    <PageContainer
      title={t("converter")}
      rightExtra={<Button onClick={handleSelectFile}>{t("addFile")}</Button>}
      className="rounded-lg bg-white dark:bg-[#1F2024]"
    >
      {contextHolder}
      <div className="p-3">
        {data && data.list.length ? (
          data.list.map((item) => {
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg bg-[#FAFCFF] p-3 dark:bg-[#27292F]"
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="text-sm text-[#343434] dark:text-[#B4B4B4]">
                    {item.name}
                  </div>
                  <div className="flex flex-row gap-3">
                    {renderActionButtons(null, item)}
                  </div>
                </div>
                <div className="text-xs text-[#AAB5CB]">{item.path}</div>
              </div>
            );
          })
        ) : (
          <Empty />
        )}
      </div>
    </PageContainer>
  );
};

export default Converter;
