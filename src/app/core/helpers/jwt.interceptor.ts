import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/auth/auth.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
  finalize,
  map,
} from 'rxjs';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  const apiUrl = environment.backEnd.baseUrl + environment.backEnd.auth.root;
  const authPath = environment.backEnd.auth;

  const isAuthPath =
    req.url.includes(apiUrl + authPath.logIn) ||
    req.url.includes(apiUrl + authPath.refreshToken) ||
    req.url.includes(apiUrl + authPath.logout) ||
    req.url.includes(apiUrl + authPath.csrf);

  let authReq = req;

  if (token && !isAuthPath) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
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

    return authService.getCsrfToken().pipe(
      switchMap(() => authService.refreshToken()),
      switchMap((response) => {
        const newToken = response.accessToken;

        tokenStorage.saveToken(newToken);
        refreshTokenSubject.next(newToken);

        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          })
        );
      }),
      catchError((err) => {
        tokenStorage.signOut();
        location.reload();
        return throwError(() => err);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) =>
      next(
        request.clone({
          setHeaders: {
            Authorization: `Bearer ${token!}`,
          },
        })
      )
    )
  );
}
