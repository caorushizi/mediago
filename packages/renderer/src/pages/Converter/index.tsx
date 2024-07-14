import React, { ReactNode, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Empty, Space, message } from "antd";
import useElectron from "../../hooks/electron";
import { usePagination } from "ahooks";
import { getFileName } from "../../utils";
import { Conversion } from "../../../../main/types/entity/Conversion";
import { DeleteOutlined, SyncOutlined } from "@ant-design/icons";
import { produce } from "immer";
import { Button } from "@/components/ui/button";

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

  const {
    data: { total, list } = { total: 0, list: [] },
    loading,
    pagination,
    refresh,
  } = usePagination(
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

  const onClickConvertToAudio = async (item: Conversion) => {
    const nextState = produce((draft) => {
      draft[item.id] = true;
    });
    setConverting(nextState);
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
  };

  const onDeleteConversion = async (id: number) => {
    await deleteConversion(id);
    refresh();
  };

  const renderActionButtons = (dom: ReactNode, item: Conversion): ReactNode => {
    // 下载成功
    return [
      <div
        key="convert"
        title={t("convertToAudio")}
        onClick={() => onClickConvertToAudio(item)}
      >
        {<SyncOutlined spin={converting[item.id]} />}
      </div>,
      <div
        key="delete"
        title={t("delete")}
        onClick={() => onDeleteConversion(item.id)}
      >
        {<DeleteOutlined />}
      </div>,
    ];
  };

  return (
    <PageContainer
      title={t("converter")}
      rightExtra={
        <Space>
          <Button
            onClick={async () => {
              const file = await selectFile();
              await addConversion({
                name: getFileName(file),
                path: file,
              });
              refresh();
            }}
          >
            {t("addFile")}
          </Button>
        </Space>
      }
      className="rounded-lg bg-white"
    >
      {contextHolder}
      <div className="p-3">
        {list.length ? (
          list.map((item) => {
            return (
              <div key={item.id} className="rounded-lg bg-[#FAFCFF] p-3">
                <div>
                  <div className="text-sm text-[#343434]">{item.name}</div>
                  {renderActionButtons(null, item)}
                </div>
                <div className="text-xs text-[#AAB5CB]">{item.path}</div>
              </div>
            );
          })
        ) : (
          <>
            <Empty />
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Converter;
