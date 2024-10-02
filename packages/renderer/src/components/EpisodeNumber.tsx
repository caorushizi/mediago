import React, { ChangeEvent, FC } from "react";
import { ConfigStore, useConfigStore } from "@/store/config";
import { useMemoizedFn } from "ahooks";
import { Input, InputNumber, Select, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

interface EpisodeNumberProps {
  value?: string;
  onChange?: (value: string) => void;
  canChangeType: boolean;
  isEdit?: boolean;
  usePrevData?: boolean;
}

const videoTypeSelector = (s: ConfigStore) => ({
  lastVideoType: s.lastVideoType,
  lastVideoName: s.lastVideoName,
  lastVideoNumber: s.lastVideoNumber,
  setLastVideo: s.setLastVideo,
});

export const EpisodeNumber: FC<EpisodeNumberProps> = ({
  value = "",
  onChange = () => {},
  canChangeType,
  usePrevData,
}) => {
  const { lastVideoName, lastVideoNumber, lastVideoType, setLastVideo } =
    useConfigStore(useShallow(videoTypeSelector));
  const { t } = useTranslation();
  const [type, setType] = useState("teleplay");
  const [name, setName] = useState("");
  const [number, setNumber] = useState(1);
  const isEpisode = useMemo(
    () => type === "teleplay" && canChangeType,
    [type, canChangeType],
  );

  /**
   * 初始化
   * 三个地方会使用到这个组件
   * 1. 新建下载： value 为空
   * 2. 编辑下载： value 有值，编辑模式， 可以使用 canChangeType 判断是否为编辑模式
   * 3. 视频嗅探： value 有值，但是不是编辑模式
   */
  useEffect(() => {
    // 如果没有，使用上次的值
    if (!value) {
      const name = lastVideoName || "";
      const number = lastVideoNumber || 1;
      const type = lastVideoType || "movie";

      setName(name);
      setNumber(number);
      setType(type);

      if (type === "teleplay" && canChangeType) {
        onChange(`${name}_第${number}集`);
      } else {
        onChange(name);
      }

      return;
    }

    // 解析名称
    const parseName = (value: string = "") => {
      const res = {
        name: "",
        number: 1,
        isTelePlay: false,
      };

      if (/_第(\d+)集$/.test(value)) {
        const [, name, number] = value.match(/(.*?)_第(\d+)集$/);
        res.name = name;
        res.number = Number(number);
        res.isTelePlay = true;
      } else {
        res.name = value;
      }

      return res;
    };
    const { name, number, isTelePlay } = parseName(value);

    if (usePrevData) {
      setName(name);
      setNumber(lastVideoNumber);
      setType(lastVideoType);

      if (lastVideoType === "teleplay" && canChangeType) {
        onChange(`${name}_第${lastVideoNumber}集`);
      } else {
        onChange(name);
      }
      return;
    }

    setName(name);
    setNumber(number);
    setType(isTelePlay ? "teleplay" : "movie");

    if (isTelePlay && canChangeType) {
      onChange(`${name}_第${number}集`);
    } else {
      onChange(name);
    }
  }, [value]);

  const handleNameChange = useMemoizedFn((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setLastVideo({ name: e.target.value });

    if (isEpisode) {
      onChange(`${e.target.value}_第${number}集`);
    } else {
      onChange(e.target.value);
    }
  });

  const onNumberChange = useMemoizedFn((val: number) => {
    setNumber(val);
    setLastVideo({ number: val });

    if (isEpisode) {
      onChange(`${name}_第${val}集`);
    }
  });

  const handleChangeType = useMemoizedFn((type: string) => {
    setLastVideo({ type });
    setType(type);

    if (type === "teleplay") {
      onChange(`${name}_第${number}集`);
    } else {
      onChange(name);
    }
  });

  return (
    <Space.Compact block>
      {canChangeType && (
        <Select
          style={{ width: 100 }}
          defaultValue="teleplay"
          options={[
            {
              label: "剧集",
              value: "teleplay",
            },
            {
              label: "电影",
              value: "movie",
            },
          ]}
          value={type}
          onChange={handleChangeType}
        />
      )}
      <Input
        value={name}
        onChange={handleNameChange}
        placeholder={t("pleaseEnterVideoName")}
      />
      {canChangeType && isEpisode && (
        <InputNumber
          style={{ width: 300 }}
          addonBefore="第"
          addonAfter="集"
          changeOnWheel
          value={number}
          min={1}
          onChange={onNumberChange}
        />
      )}
    </Space.Compact>
  );
};
