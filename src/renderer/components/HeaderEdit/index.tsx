import "./index.scss";
import React, { ChangeEvent, FC, useCallback } from "react";
import { Form, Input } from "antd";

const { TextArea } = Input;

export interface HeaderEditProps {
  label: string;
  name: string;
  valuePropName?: string;
  placeholder?: string;
}

interface PriceInputProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
}

// 编辑 header
const HeaderFieldInput: FC<PriceInputProps> = ({ value, onChange }) => {
  const processHeader = useCallback((value?: Record<string, string>) => {
    console.log("vale:", value);
    if (!value) return "";
    return Object.keys(value).map((key) => `${key}: ${value[key]}`);
  }, []);

  const parsedValue = processHeader(value);

  const onInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value
      .split("\n")
      .reduce((cur: Record<string, string>, prev) => {
        const [key, value] = prev.split(":");
        cur[key] = value;
        return cur;
      }, {});
    onChange?.(value);
  };

  return (
    <TextArea
      value={parsedValue}
      onChange={onInputChange}
      autoSize={{ minRows: 3, maxRows: 5 }}
      allowClear
    />
  );
};

// Http Header 编辑组件
const HeaderEdit: FC<HeaderEditProps> = ({
  label,
  valuePropName,
  name,
  placeholder,
}) => {
  console.log("value: ", valuePropName);
  console.log("value: ", name);
  return (
    <Form.Item name={name} label={label} valuePropName={valuePropName}>
      <HeaderFieldInput />
    </Form.Item>
  );
};

export default HeaderEdit;
