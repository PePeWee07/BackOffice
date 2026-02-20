import { Injectable, Inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, exhaustMap, tap, first } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthenticationService } from '../../core/services/auth.service';
import { login, loginSuccess, loginFailure, logout, logoutSuccess, Register, RegisterSuccess, RegisterFailure } from './authentication.actions';
import { Router } from '@angular/router';
import { UserProfileService } from '../../core/services/user.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
@Injectable()
export class AuthenticationEffects {

  Register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Register),
      exhaustMap(({ email, username, password }) => {
          return this.AuthenticationService.register( email, username, password).pipe(
            map((user) => {
              this.router.navigate(['/auth/login']);
              return RegisterSuccess({ user })
            })
          )
      })
    )
  );



  login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(login),
    exhaustMap(({ email, password }) => {
      return this.AuthenticationService.login(email, password).pipe(
        map((user) => {
          if (user) {
            this.tokenStorage.saveUser(user);
            this.tokenStorage.saveToken(user.jwt!);
            this.tokenStorage.saveRefreshToken(user.refreshToken!);
            this.router.navigate(['/']);
          }
          return loginSuccess({ user });
        }),
        catchError((error) => of(loginFailure({ error })))
      );
    })
  )
);


  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      tap(() => {
        // Perform any necessary cleanup or side effects before logging out
      }),
      exhaustMap(() => of(logoutSuccess()))
    )
  );

  constructor(
    @Inject(Actions) private actions$: Actions,
    private AuthenticationService: AuthenticationService,
    private userService: UserProfileService,
    private tokenStorage: TokenStorageService,
    private router: Router) { }

}
