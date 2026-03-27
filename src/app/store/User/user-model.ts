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

// Pagina
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

// Orden
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

// User
export interface UserModel {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dni: string;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  roles: RoleModel[];
  accountExpiryDate: Date | null;
  authorities: AuthorityModel[];
  username: string;
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

// Roles-User
export interface RoleModel {
  id: number;
  name: string;
  permissionList: AuthorityModel[];
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

// Permission-User
export interface AuthorityModel {
  id: number | null;
  name: string;
  createdBy?: null | string;
  createdDate?: Date | null;
  lastModifiedBy?: null | string;
  lastModifiedDate?: Date | null;
}

// Manager - Create (ADMIN)
export interface UserRequest {
  name?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dni?: string;
  enabled?: boolean;
  password?: string;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  rolesIds?: number[];
  accountExpiryDate?: string;
}

export interface RoleRequest {
  name: string;
  permissionsIds?: number[];
}

export interface RoleResponse {
  id: number;
  name: string;
  permissionList?: PermissionListResponse[];
}

export interface PermissionListRequest {
  name: string;
}

export interface PermissionListResponse {
  id: number;
  name: string;
}

// Parmas at Paginate
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
  enabled: Boolean;
  accountNonExpired: Boolean;
  accountNonLocked: Boolean;
  credentialsNonExpired: Boolean;
  accountExpiryDate: string;
}

