import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { JwtToken } from './jwt.model';

export const AuthGuard: CanActivateFn = (route) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  const currentUser = authService.currentUserValue;

  if (!currentUser) {
    router.navigate(['/account-login']);
    return false;
  }

  const requiredRoles = route.data?.['roles'] as string[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // solo requiere login
  }

  const token: JwtToken = tokenStorage.getDataToken(
    tokenStorage.getToken() || ''
  );

  if (!token?.authorities) {
    return router.navigate(['/account-unauthorized']);
  }

  const authoritiesArray = token.authorities.split(',');
  const userRoles = authoritiesArray.filter((auth) => auth.startsWith('ROLE_'));

  const hasRole = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return router.navigate(['/account-unauthorized']);
  }

  return true;
};
