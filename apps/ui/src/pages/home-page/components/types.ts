export type CurrTerminal = {
  title: string;
  id: number;
  log: string;
};

export type ListPagination = {
  current: number;
  pageSize: number;
  total: number;
  totalPage: number;
  onChange: (current: number, pageSize: number) => void;
  changeCurrent: (current: number) => void;
  changePageSize: (pageSize: number) => void;
};
