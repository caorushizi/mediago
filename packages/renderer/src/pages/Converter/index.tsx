import React, { ReactNode, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { App, Empty } from "antd";
import useElectron from "@/hooks/useElectron";
import { useMemoizedFn, usePagination } from "ahooks";
import { getFileName, tdApp } from "@/utils";
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
  const { message } = App.useApp();
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
      message.success(t("convertSuccess"));
    } catch (e: any) {
      message.error(e.message);
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

  const renderActionButtons = useMemoizedFn((item: Conversion): ReactNode => {
    // Download successfully
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
  });

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
      <div className="flex flex-col gap-3 rounded-lg bg-white p-3 dark:bg-[#1F2024]">
        {data && data.list.length ? (
          data.list.map((item) => {
            return (
              <div
                key={item.id}
                className="flex flex-1 flex-col gap-3 rounded-lg bg-[#FAFCFF] p-3 dark:bg-[#27292F]"
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="text-sm text-[#343434] dark:text-[#B4B4B4]">
                    {item.name}
                  </div>
                  <div className="flex flex-row gap-3">
                    {renderActionButtons(item)}
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
