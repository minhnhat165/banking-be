export type Pagination<DataType> = {
  items: DataType[];
  total: number;
  currentPage: number;
  totalPages: number;
};
