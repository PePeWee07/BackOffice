export interface CatiaPage<T> {
  content: T[];
  pageable: CatiaPageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface CatiaPageable {
  pageNumber: number;
  pageSize: number;
  sort: CatiaSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface CatiaSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}
