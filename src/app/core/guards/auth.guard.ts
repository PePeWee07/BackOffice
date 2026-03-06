import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/auth/auth.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { JwtToken } from '../../store/Authentication/jwt.model';

export const AuthGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  const tokenStr = tokenStorage.getToken();

  if (!tokenStr) {
    router.navigate(['/account-login']);
    return false;
  }

  const requiredRoles = route.data?.['roles'] as string[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const token: JwtToken = tokenStorage.getDataToken(tokenStr);

  const authoritiesArray = token.authorities.split(',');
  const userRoles = authoritiesArray.filter((auth) => auth.startsWith('ROLE_'));

  const hasRole = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    router.navigate(['/account-unauthorized']);
    return false;
  }

  return true;
};
