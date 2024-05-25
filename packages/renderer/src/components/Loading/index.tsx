import React, { FC } from "react";
import { useStyles } from "./styles";
import { Spin } from "antd";

const Loading: FC = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.container}>
      <Spin />
    </div>
  );
};

export default Loading;
