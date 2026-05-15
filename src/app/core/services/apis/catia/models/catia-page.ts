export interface CatiaPage<T> {
  content: T[];
  page: CatiaPageable;
}

export interface CatiaPageable {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface CatiaSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}
