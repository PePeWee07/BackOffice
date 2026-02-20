import { TokenStorageService } from './token-storage.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { from, map, tap } from 'rxjs';
import { AuthResponse } from '../../store/Authentication/auth.models';
import { getFirebaseBackend } from '../../authUtils';


@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

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

  user!: AuthResponse;

  /**
   * Performs the auth
   * @param email email of user
   * @param password password of user
   */
  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`/back-end-auth/log-in`, {
        username: email,
        password,
      })
      .pipe(
        map((user: AuthResponse) => {
          if (user) {
            this.currentUserSubject.next(user);
          }
          return user;
        })
      );
  }

  /**
   * Performs the register
   * @param email email
   * @param password password
   */
  register(email: any, username: any, password: any) {
    return from(
      getFirebaseBackend()
        .registerUser(email, username, password)
        .then((response: any) => {
          const user = response;
          return user;
        })
    );
  }

  /**
   * Reset password
   * @param email email
   */
  resetPassword(email: string) {
    return getFirebaseBackend()
      .forgetPassword(email)
      .then((response: any) => {
        const message = response.data;
        return message;
      });
  }

  /**
   * Logout the user
   */
  logout() {
    this.http
      .post<any>(
        `/back-end-auth/log-out`,
        {},
        { headers: { Authorization: `Bearer ${this.currentUserValue?.jwt}` } }
      )
      .subscribe((resp: any) => {
        this.tokenStorage.signOut();
        this.currentUserSubject.next(null);
      });
  }

  refreshToken() {
    const refreshToken = this.tokenStorage.getRefreshToken();

    return this.http
      .post<AuthResponse>('/back-end-auth/token-refresh', {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((response: AuthResponse) => {
          this.tokenStorage.saveUser(response);
          this.tokenStorage.saveToken(response.jwt!);
          this.tokenStorage.saveRefreshToken(response.refreshToken!);
        })
      );
  }
}

