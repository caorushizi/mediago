import { DownloadFilter } from "@mediago/shared-common";
import { useState } from "react";
import useSWR from "swr";
import useAPI from "./use-api";

export function useTasks(filter: DownloadFilter = DownloadFilter.list) {
  const { getDownloadItems } = useAPI();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, error, isLoading, mutate } = useSWR(
    {
      key: "api/tasks",
      args: {
        current: page,
        pageSize,
        filter,
      },
    },
    ({ args }) => {
      return getDownloadItems(args);
    },
  );

  console.log("useTasks data", data);

  return {
    data,
    isLoading,
    error,
    mutate,
    pagination: {
      page,
      pageSize,
    },
    setPage,
    setPageSize,
  };
}
