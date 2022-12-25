import "./index.scss";
import React, { FC, useEffect, useState } from "react";
import { AutoComplete, Form, Input, Row, Col, Button } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { nanoid } from "nanoid";
import classNames from "classnames";

export interface HeaderEditProps {
  label: string;
  name: string;
  valuePropName?: string;
  placeholder?: string;
}

interface HeaderFieldInputProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
}

const options = [
  { value: "Accept" },
  { value: "Accept-Charset" },
  { value: "Accept-Encoding" },
  { value: "Accept-Language" },
  { value: "Accept-Ranges" },
  { value: "Authorization" },
  { value: "Cache-Control" },
  { value: "Connection" },
  { value: "Cookie" },
  { value: "Content-Length" },
  { value: "Content-Type" },
  { value: "Date" },
  { value: "From" },
  { value: "Host" },
  { value: "If-Match" },
  { value: "If-Modified-Since" },
  { value: "If-None-Match" },
  { value: "If-Range" },
  { value: "If-Unmodified-Since" },
  { value: "Max-Forwards" },
  { value: "Pragma" },
  { value: "Proxy-Authorization" },
  { value: "Range" },
  { value: "Referer" },
  { value: "TE" },
  { value: "Upgrade" },
  { value: "User-Agent" },
  { value: "Via" },
  { value: "Warning" },
];

interface FormItem {
  id: string;
  key: string;
  value: string;
}

// 编辑 header
const HeaderFieldInput: FC<HeaderFieldInputProps> = ({ value, onChange }) => {
  const [formValues, setFormValues] = useState<FormItem[]>([]);

  useEffect(() => {
    const values = processHeader(value);
    setFormValues(values);
  }, []);

  const processHeader = (value?: Record<string, string> | string) => {
    if (!value) return [];
    if (typeof value === "string") {
      return value.split("\n").map((item) => {
        const [key, value] = item.split(": ");
        return {
          id: nanoid(),
          key,
          value,
        };
      });
    }
    return Object.entries(value).map(([key, value]) => ({
      id: nanoid(),
      key,
      value,
    }));
  };

  const postHeader = (values: FormItem[]) => {
    return values.reduce((cur: Record<string, string>, prev) => {
      if (!prev.key) return cur;

      cur[prev.key] = prev.value;
      return cur;
    }, {});
  };

  const onInputChange = (item: FormItem): void => {
    const copiedFormValues = formValues.slice();

    const changeItem = copiedFormValues.find((i) => i.id === item.id);
    if (changeItem == null) return;

    changeItem.key = item.key;
    changeItem.value = item.value;

    setFormValues(copiedFormValues);
    onChange?.(postHeader(copiedFormValues));
  };

  const onInputDelete = (item: FormItem) => {
    const changeItemIndex = formValues.findIndex((i) => i.id === item.id);
    if (changeItemIndex < 0) return;

    const copiedFormValues = formValues.slice();
    copiedFormValues.splice(changeItemIndex, 1);
    setFormValues(copiedFormValues);
    onChange?.(postHeader(copiedFormValues));
  };

  const onInputAdd = () => {
    const changedValue = [...formValues, { id: nanoid(), key: "", value: "" }];
    setFormValues(changedValue);
  };

  // 渲染表单项
  const renderItem = (
    item: FormItem,
    index: number,
    onChange: (item: FormItem) => void,
    onDelete: (item: FormItem) => void
  ) => {
    return (
      <Row
        className={classNames("header-item-container", {
          "is-first": index === 0,
          "is-last": index === formValues.length - 1,
        })}
        key={item.id}
      >
        <Col span={8}>
          <AutoComplete
            value={item.key}
            options={options}
            allowClear={true}
            dropdownMatchSelectWidth={false}
            placeholder={"请填写请求标头"}
            filterOption={(inputValue, option) => {
              if (option == null) return false;
              return option.value
                .toUpperCase()
                .includes(inputValue.toUpperCase());
            }}
            onChange={(value) => {
              onChange({ ...item, key: value });
            }}
          />
        </Col>
        <Col span={14}>
          <Input
            value={item.value}
            placeholder={"填写请求标头的值"}
            onChange={(e) => {
              onChange({ ...item, value: e.target.value });
            }}
          />
        </Col>
        <Col span={2} className={"form-item-action"}>
          <DeleteOutlined
            style={{ color: "#F56C6C", cursor: "pointer" }}
            onClick={() => onDelete(item)}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div>
      {formValues.length > 0 && (
        <div className={"header-field-container"}>
          {formValues.map((formItem, index) => {
            return renderItem(formItem, index, onInputChange, onInputDelete);
          })}
        </div>
      )}
      <div className={"action-button"}>
        <div>{formValues.length <= 0 && "点击添加 header"}</div>
        <Button
          size={"small"}
          type={"link"}
          icon={<PlusOutlined />}
          onClick={onInputAdd}
        >
          添加
        </Button>
      </div>
    </div>
  );
};

// Http Header 编辑组件
const HeaderEdit: FC<HeaderEditProps> = ({ label, valuePropName, name }) => {
  return (
    <Form.Item
      className={"header-edit"}
      name={name}
      label={label}
      valuePropName={valuePropName}
    >
      <HeaderFieldInput />
    </Form.Item>
  );
};

export default HeaderEdit;
