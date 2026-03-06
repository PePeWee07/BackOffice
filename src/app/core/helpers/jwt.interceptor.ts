import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/auth/auth.service';
import { TokenStorageService } from './../services/auth/token-storage.service';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  finalize,
} from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  // 1. No añadir token si es la ruta de login o refresh
  const isAuthPath =
    req.url.includes('/back-end-auth/log-in') ||
    req.url.includes('/back-end-auth/token-refresh');

  let authReq = req;
  if (token && !isAuthPath) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // 2. Si da 401 y no es la ruta de login, intentamos refrescar
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthPath
      ) {
        return handle401Error(authReq, next, authService, tokenStorage);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthenticationService,
  tokenStorage: TokenStorageService
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        const newToken = (response as { jwt: string }).jwt;
        console.log('Nuevo Token: ', newToken);
        refreshTokenSubject.next(newToken);

        // Reintentamos la petición original con el nuevo token
        return next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          })
        );
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.tokenStorage.signOut();
        location.reload(); // O redirigir a login
        return throwError(() => err);
      })
    );
  } else {
    // Si ya se está refrescando, esperamos a que el primer proceso termine
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        );
      })
    );
  }
}
