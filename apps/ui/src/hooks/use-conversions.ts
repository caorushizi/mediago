import useSWR from "swr";
import {
  getConversionsKey,
  getConversions,
  addConversion as addApi,
  deleteConversion as delApi,
  startConversion as startApi,
  stopConversion as stopApi,
} from "@/api/conversion";
import type { Conversion, ConversionPagination } from "@mediago/shared-common";

export function useConversions(pagination: ConversionPagination) {
  const { data, isLoading, error, mutate } = useSWR(
    [getConversionsKey, pagination.current, pagination.pageSize],
    () => getConversions(pagination),
    {
      refreshInterval: (latestData: unknown) => {
        const d = latestData as { list?: Conversion[] } | undefined;
        return d?.list?.some((i) => i.status === "converting") ? 1000 : 0;
      },
    },
  );

  const addConversion = async (conv: {
    name: string;
    path: string;
    outputFormat: string;
    quality?: string;
  }) => {
    await addApi(conv);
    mutate();
  };

  const deleteConversion = async (id: number) => {
    await delApi(id);
    mutate();
  };

  const startConversion = async (id: number) => {
    await startApi(id);
    mutate();
  };

  const stopConversion = async (id: number) => {
    await stopApi(id);
    mutate();
  };

  return {
    data: data as { list: Conversion[]; total: number } | undefined,
    isLoading,
    error,
    mutate,
    addConversion,
    deleteConversion,
    startConversion,
    stopConversion,
  };
}
