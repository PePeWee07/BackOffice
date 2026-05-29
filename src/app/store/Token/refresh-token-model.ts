import { Page } from '../User/user-model';

export interface RefreshToken {
  id: number;
  jti: string;
  revoked: boolean;
  expiresAt: string;
  expired: boolean;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  userLastName: string | null;
}

export type RefreshTokenPage = Page<RefreshToken>;

export interface RefreshTokenQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  userId?: number;
  email?: string;
  jti?: string;
  revoked?: boolean;
  expired?: boolean;
}

export interface DeleteByUserResult {
  userId: number;
  deleted: number;
}
