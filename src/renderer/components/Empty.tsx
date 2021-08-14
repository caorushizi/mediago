import React, { FC, ReactNode } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";

interface Props {
  title?: string;
  subTitle?: string;
  extra?: ReactNode;
}

const Empty: FC<Props> = ({ title, subTitle, extra }) => {
  return (
    <VStack>
      <Text>{title}</Text>
      <Text>{subTitle}</Text>
      {extra && <Box>{extra}</Box>}
    </VStack>
  );
};

Empty.defaultProps = {
  title: "暂无数据",
  subTitle: "请输入详细描述",
};

export default Empty;
