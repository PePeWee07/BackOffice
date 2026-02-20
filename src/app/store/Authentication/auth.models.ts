export interface AuthResponse {
  username: string;
  message: string;
  status: boolean;
  jwt: string;
  refreshToken: string;
}
