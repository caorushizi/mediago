import React, { FC } from "react";
import "./index.scss";
import { ModalForm, ProFormText, ProList } from "@ant-design/pro-components";
import { Button, Col, Form, message, Row, Space } from "antd";
import { useRequest } from "ahooks";
import { getCollections } from "../../api";
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import { wait } from "../../utils";

// 收藏列表页
const Collections: FC = () => {
  const { data: collections, error, loading } = useRequest(getCollections);
  const [form] = Form.useForm<Collection>();

  return (
    <div className={"collections"}>
      <ProList<Collection>
        loading={loading}
        toolBarRender={() => {
          return [
            <ModalForm<Collection>
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 14 }}
              layout={"horizontal"}
              key={"add"}
              title="新建表单"
              trigger={
                <Button type="primary">
                  <PlusOutlined />
                  添加
                </Button>
              }
              form={form}
              autoFocusFirstInput
              modalProps={{
                destroyOnClose: true,
                onCancel: () => console.log("run"),
              }}
              submitTimeout={2000}
              onFinish={async (values) => {
                await wait(2);
                console.log(values.title);
                await message.success("提交成功");
                return true;
              }}
            >
              <ProFormText name="url" label="url" />
              <ProFormText name="title" label="标题" />
              <ProFormText name="desc" label="简述" />
            </ModalForm>,
          ];
        }}
        onRow={(record: any) => {
          return {
            onMouseEnter: () => {
              console.log(record);
            },
            onClick: () => {
              console.log(record);
            },
          };
        }}
        rowKey="name"
        headerTitle="收藏列表"
        tooltip="基础列表的配置"
        dataSource={collections}
        // showActions="hover"
        // showExtra="hover"
        metas={{
          title: {
            dataIndex: "title",
          },
          description: {
            dataIndex: "desc",
          },
          subTitle: {
            render: (node, item) => {
              return (
                item.is_favorite === true && (
                  <StarFilled style={{ color: "#f60" }} />
                )
              );
            },
          },
          actions: {
            render: (text, row) => [
              row.is_favorite === true ? (
                <Button key={"add"} type={"text"}>
                  取消收藏
                </Button>
              ) : (
                <Button key={"add"} type={"text"}>
                  添加收藏
                </Button>
              ),
              <Button key={"del"} type={"text"} danger>
                删除
              </Button>,
            ],
          },
        }}
      />
    </div>
  );
};

export default Collections;
