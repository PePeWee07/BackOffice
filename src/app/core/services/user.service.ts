import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../../store/Authentication/auth.models';


@Injectable({ providedIn: 'root' })
export class UserProfileService {
    constructor(private http: HttpClient) { }
    /***
     * Get All AuthResponse
     */
    getAll() {
        return this.http.get<AuthResponse[]>(`api/users`);
    }

    /***
     * Facked AuthResponse Register
     */
    register(user: AuthResponse) {
        return this.http.post(`/users/register`, user);
    }
}
