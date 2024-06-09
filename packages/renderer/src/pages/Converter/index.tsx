import React from "react";
import PageContainer from "../../components/PageContainer";
import { useTranslation } from "react-i18next";

const Converter = () => {
  const { t } = useTranslation();
  return <PageContainer title={t("converter")}>开发中</PageContainer>;
};

export default Converter;
