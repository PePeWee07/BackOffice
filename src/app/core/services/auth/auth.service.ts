import { TokenStorageService } from './token-storage.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, finalize, Observable } from 'rxjs';
import { tap } from 'rxjs';
import { AuthResponse } from '../../../store/Authentication/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

  constructor(
    private http: HttpClient,
    public tokenStorage: TokenStorageService
  ) {
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      this.tokenStorage.getUser()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  user!: AuthResponse;

  private isLoggingIn = false;
  login(email: string, password: string) {
    if (this.isLoggingIn) return EMPTY;

    this.isLoggingIn = true;
    return this.http
      .post<AuthResponse>(`/back-end-auth/log-in`, {
        username: email,
        password,
      })
      .pipe(
        tap((user) => {
          this.currentUserSubject.next(user);
          this.tokenStorage.saveUser(user);
          this.tokenStorage.saveToken(user.jwt);
          this.tokenStorage.saveRefreshToken(user.refreshToken!);
        }),
        finalize(() => (this.isLoggingIn = false))
      );
  }

  logout() {
    let email = this.currentUserValue?.username;

    const params = new HttpParams().set('email', email ?? 'Anonymus');

    return this.http.post(`/back-end-auth/log-out`, null, { params });
  }

  refreshToken() {
    const refreshToken = this.tokenStorage.getRefreshToken();

    return this.http
      .post<AuthResponse>('/back-end-auth/token-refresh', {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((response: AuthResponse) => {
          if (response) {
            this.currentUserSubject.next(response);
            this.tokenStorage.saveUser(response);
            this.tokenStorage.saveToken(response.jwt);
            this.tokenStorage.saveRefreshToken(response.refreshToken!);
          }
        })
      );
  }

  /**
   * Performs the register
   * @param email email
   * @param password password
   */
  register(email: any, username: any, password: any) {
    return null;
  }

  /**
   * Reset password
   * @param email email
   */
  resetPassword(email: string) {
    return null;
  }
}

