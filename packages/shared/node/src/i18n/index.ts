import i18n, { type InitOptions, type Resource } from "i18next";
import { BASE_I18N_OPTIONS, i18nResources } from "@mediago/shared-common";

const nodeResources: Resource = {
  en: { translation: i18nResources.en },
  zh: { translation: i18nResources.zh },
};

const nodeI18nOptions: InitOptions = {
  ...BASE_I18N_OPTIONS,
  resources: nodeResources,
};

if (!i18n.isInitialized) {
  void i18n.init(nodeI18nOptions);
}

export { i18n };
export { nodeI18nOptions, nodeResources as nodeI18nResources };
export default i18n;
