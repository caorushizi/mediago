import { http } from "@/utils";

export const getPageTitle = (url: string) =>
  http.get<string>("/api/url/title", { params: { url } });
