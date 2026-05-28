import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { RoutePermissionService } from '../services/administration/route-permission.service';
import { JwtToken } from '../../store/Authentication/jwt.model';

export const AuthGuard: CanActivateFn = (route): Observable<boolean> | boolean => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const routePermissionService = inject(RoutePermissionService);

  const tokenStr = tokenStorage.getToken();

  if (!tokenStr) {
    router.navigate(['/account-login']);
    return false;
  }

  const token: JwtToken = tokenStorage.getDataToken(tokenStr);
  const authoritiesArray = token.authorities.split(',');
  const userRoles = authoritiesArray.filter((auth) => auth.startsWith('ROLE_'));

  const path = route.routeConfig?.path ?? '';

  const evaluate = (requiredRoles: string[] | undefined): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const normalized = requiredRoles.map((role) =>
      role.startsWith('ROLE_') ? role : `ROLE_${role}`
    );
    const hasRole = normalized.some((role) => userRoles.includes(role));
    if (!hasRole) {
      router.navigate(['/account-unauthorized']);
      return false;
    }
    return true;
  };

  const cached = routePermissionService.snapshot;
  if (cached) {
    return evaluate(routePermissionService.getRolesForPath(path));
  }

  return routePermissionService
    .load()
    .pipe(map(() => evaluate(routePermissionService.getRolesForPath(path))));
};
