export interface JwtToken {
  iss: string;
  sub: string;
  authorities: string;
  iat: number;
  exp: number;
  jti: string;
  nbf: number;
}
