import { http } from "@/utils";

export const getPageTitle = (url: string): Promise<{ data: string }> =>
  http.get("/api/url/title", { params: { url } });
