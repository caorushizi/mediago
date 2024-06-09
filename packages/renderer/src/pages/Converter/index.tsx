import React from "react";
import PageContainer from "../../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Button, Space } from "antd";
import useElectron from "../../hooks/electron";
import { ProList } from "@ant-design/pro-components";
import { usePagination } from "ahooks";
import { getFileName } from "../../utils";
import { Conversion } from "../../../../main/types/entity/Conversion";

const Converter = () => {
  const { t } = useTranslation();
  const { selectFile, getConversions, addConversion } = useElectron();
  const {
    data = { total: 0, list: [] },
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
    }
  );

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
    >
      <ProList<Conversion>
        loading={loading}
        className="download-list"
        pagination={pagination}
        metas={{
          title: {
            render: (text, record) => {
              return record.name;
            },
          },
          description: {
            render: (text, record) => {
              return record.path;
            },
          },
        }}
        rowKey="id"
        dataSource={data.list}
      />
    </PageContainer>
  );
};

export default Converter;
