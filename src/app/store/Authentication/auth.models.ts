export interface AuthResponse {
  username: string;
  message: string;
  roles: string[];
  accessToken: string;
  status: boolean;
}
