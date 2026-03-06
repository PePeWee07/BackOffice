export interface JwtToken {
  type: string;
  iss: string;
  sub: string;
  authorities: string;
  iat: number;
  exp: number;
  jti: string;
  nbf: number;
}
