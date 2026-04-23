import i18n, { type InitOptions, type Resource } from "i18next";
import {
  BASE_I18N_OPTIONS,
  i18nResources,
  SUPPORTED_LANGUAGES,
} from "@mediago/shared-common";

const nodeResources: Resource = SUPPORTED_LANGUAGES.reduce<Resource>(
  (resources, language) => {
    resources[language] = { translation: i18nResources[language] };
    return resources;
  },
  {},
);

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
