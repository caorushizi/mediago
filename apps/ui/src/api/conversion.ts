import { http } from "@/utils";
import type { ConversionPagination } from "@mediago/shared-common";

export const getConversionsKey = "/api/conversions";
export const getConversions = (p: ConversionPagination) =>
  http.get(getConversionsKey, {
    params: { current: p.current, pageSize: p.pageSize },
  });

export const addConversion = (data: {
  name: string;
  path: string;
  outputFormat: string;
  quality?: string;
}) => http.post("/api/conversions", data);

export const deleteConversion = (id: number) =>
  http.delete(`/api/conversions/${id}`);

export const startConversion = (id: number) =>
  http.post(`/api/conversions/${id}/start`);

export const stopConversion = (id: number) =>
  http.post(`/api/conversions/${id}/stop`);
