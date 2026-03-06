import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';


const USER_KEY = 'currentUser';
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  constructor() {}

  // Método para limpiar los datos del usuario y los tokens almacenados
  public signOut(): void {
    localStorage.clear();
  }

  // Método para obtener los datos del usuario almacenados
  public getUser(): any | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Método para guardar los datos del usuario
  public saveUser(user: any): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Método para guardar el token JWT
  public saveToken(token: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Método para guardar el token JWT refresco
  public saveRefreshToken(refreshToken: string): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Método para obtener el token JWT refresco almacenado
  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Método para obtener el token JWT almacenado
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Método para decodificar el token JWT y obtener los datos del payload
  public getDataToken(token: string): any {
    try {
      return token ? jwtDecode(token) : null;
    } catch (error) {
      return null;
    }
  }
}
