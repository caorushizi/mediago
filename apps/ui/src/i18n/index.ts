import { createBrowserI18n } from "@mediago/shared-browser";

const i18n = createBrowserI18n({
  debug: import.meta.env.MODE === "development",
});

export default i18n;
