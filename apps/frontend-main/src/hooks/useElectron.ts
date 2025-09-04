import useAPI from "./useAPI";

/**
 * @deprecated 请使用 useAPI Hook 替代
 * 为了向后兼容保留的别名
 */
export default function useElectron() {
  return useAPI();
}
