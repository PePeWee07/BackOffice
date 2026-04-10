import { TokenStorageService } from './token-storage.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, finalize, Observable } from 'rxjs';
import { tap } from 'rxjs';
import { AuthResponse } from '../../../store/Authentication/auth.models';
import { CsrfResponse } from '../../../store/Authentication/CsrfResponse';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

  private isLoggingIn = false;
  private csrfToken: string | null = null;
  private csrfHeaderName = 'X-XSRF-TOKEN';
  private apiUrl = environment.backEnd.baseUrl + environment.backEnd.auth.root;
  private authPath = environment.backEnd.auth;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) {
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      this.tokenStorage.getUser()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getCsrfToken() {
    return this.http
      .get<CsrfResponse>(this.apiUrl + this.authPath.csrf, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.csrfToken = response.token;
          this.csrfHeaderName = response.headerName || 'X-XSRF-TOKEN';
        })
      );
  }

  login(email: string, password: string) {
    if (this.isLoggingIn) return EMPTY;
    if (!this.csrfToken) {
      throw new Error('CSRF token not loaded');
    }

    this.isLoggingIn = true;

    return this.http
      .post<AuthResponse>(
        this.apiUrl + this.authPath.logIn,
        {
          username: email,
          password,
        },
        {
          withCredentials: true,
          headers: new HttpHeaders({
            [this.csrfHeaderName]: this.csrfToken,
          }),
        }
      )
      .pipe(
        tap((response) => {
          this.currentUserSubject.next(response);
          this.tokenStorage.saveUser(response);
          this.tokenStorage.saveToken(response.accessToken);
        }),
        finalize(() => (this.isLoggingIn = false))
      );
  }

  refreshToken() {
    if (!this.csrfToken) {
      throw new Error('CSRF token not loaded');
    }

    return this.http
      .post<AuthResponse>(
        this.apiUrl + this.authPath.refreshToken,
        {},
        {
          withCredentials: true,
          headers: new HttpHeaders({
            [this.csrfHeaderName]: this.csrfToken,
          }),
        }
      )
      .pipe(
        tap((response) => {
          this.currentUserSubject.next(response);
          this.tokenStorage.saveUser(response);
          this.tokenStorage.saveToken(response.accessToken);
        })
      );
  }

  logout() {
    if (!this.csrfToken) {
      throw new Error('CSRF token not loaded');
    }

    return this.http
      .post(
        this.apiUrl + this.authPath.logout,
        {},
        {
          withCredentials: true,
          headers: new HttpHeaders({
            [this.csrfHeaderName]: this.csrfToken,
          }),
        }
      )
      .pipe(
        tap(() => {
          this.tokenStorage.signOut();
          this.currentUserSubject.next(null);
          this.csrfToken = null;
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
