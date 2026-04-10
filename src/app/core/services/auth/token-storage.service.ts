import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

const USER_KEY = 'currentUser';
const TOKEN_KEY = 'token';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  constructor() {}

  public signOut(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  public getUser(): any | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  public saveUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public getDataToken(token: string): any {
    try {
      return token ? jwtDecode(token) : null;
    } catch {
      return null;
    }
  }
}
