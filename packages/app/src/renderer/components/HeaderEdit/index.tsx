import "./index.scss";
import React, { FC, useCallback, useEffect, useState } from "react";
import { AutoComplete, Form, Input, Row, Col, Button } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Box } from "@chakra-ui/react";
import { nanoid } from "nanoid";

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

const renderItem = (
  item: FormItem,
  onChange: (item: FormItem) => void,
  onDelete: (item: FormItem) => void
) => {
  return (
    <Row className={"header-item-container"} key={item.id}>
      <Col span={8}>
        <AutoComplete
          value={item.key}
          style={{ width: "100%" }}
          options={options}
          dropdownMatchSelectWidth={false}
          filterOption={(inputValue, option) => {
            if (!option) return false;
            return (
              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
              -1
            );
          }}
          onChange={(value) => {
            onChange({ ...item, key: value });
          }}
        />
      </Col>
      <Col span={14}>
        <Input
          value={item.value}
          onChange={(e) => {
            onChange({ ...item, value: e.target.value });
          }}
        />
      </Col>
      <Col span={1} className={"form-item-action"}>
        <DeleteOutlined
          style={{ color: "#F56C6C", cursor: "pointer" }}
          onClick={() => onDelete(item)}
        />
      </Col>
    </Row>
  );
};

// 编辑 header
const HeaderFieldInput: FC<HeaderFieldInputProps> = ({ value, onChange }) => {
  const [formValues, setFormValues] = useState<FormItem[]>([]);

  useEffect(() => {
    const values = processHeader(value);
    setFormValues(values);
  }, []);

  const processHeader = (value?: Record<string, string>) => {
    if (!value) return [];
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
    if (!changeItem) return;

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

  return (
    <Box>
      {formValues.length > 0 && (
        <Box className={"header-field-container"} mb={6}>
          {formValues.map((formItem) => {
            return renderItem(formItem, onInputChange, onInputDelete);
          })}
        </Box>
      )}
      <Box d={"flex"} justifyContent={"space-between"} alignItems={"center"}>
        <Box>{formValues.length <= 0 && "点击添加 header"}</Box>
        <Button
          size={"small"}
          type={"link"}
          icon={<PlusOutlined />}
          onClick={onInputAdd}
        >
          添加
        </Button>
      </Box>
    </Box>
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
