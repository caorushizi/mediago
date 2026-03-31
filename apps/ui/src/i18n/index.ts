import { createBrowserI18n } from "./createBrowserI18n";

const i18n = createBrowserI18n({
  debug: import.meta.env.MODE === "development",
});

export default i18n;
