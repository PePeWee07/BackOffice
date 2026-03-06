// Paginacion
export interface Page<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

// Usuario
export interface UserModel {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dni: string;
  password?: string; // Only Admin get
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  roles: RoleModel[];
  // rolesIds?: number[]; // Para POST
  accountExpiryDate: Date | null;
  authorities: AuthorityModel[];
  username: string;
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

export interface AuthorityModel {
  id?: number | null;
  name: string;
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

export interface RoleModel {
  id: number;
  name: string;
  permissionList: AuthorityModel[];
  // permissionsIds?: number[]; // Para POST
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

export class LoginModel {
  username?: string;
  password?: string;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;

  sortBy?: keyof UserModel;
  direction?: 'asc' | 'desc';

  id?: number;
  name?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dni?: string;
}

