import { http } from "@/utils";
import type {
  Conversion,
  ConversionPagination,
  ConversionResponse,
} from "@mediago/shared-common";

export const getConversionsKey = "/api/conversions";
export const getConversions = (
  p: ConversionPagination,
): Promise<ConversionResponse> =>
  http.get(getConversionsKey, {
    params: { current: p.current, pageSize: p.pageSize },
  });

export const addConversion = (data: {
  name: string;
  path: string;
  outputFormat: string;
  quality?: string;
}): Promise<Conversion> => http.post("/api/conversions", data);

export const deleteConversion = (id: number): Promise<void> =>
  http.delete(`/api/conversions/${id}`);

export const startConversion = (id: number): Promise<void> =>
  http.post(`/api/conversions/${id}/start`);

export const stopConversion = (id: number): Promise<void> =>
  http.post(`/api/conversions/${id}/stop`);
