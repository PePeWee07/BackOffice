import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { UserModel, UserRequest } from '../../../store/User/user-model';

interface ApiResponse<T> {
  status: number;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private http = inject(HttpClient);

  private apiUrl =
    environment.backEnd.baseUrl + environment.backEnd.api.root + '/user';

  getProfile(): Observable<UserModel> {
    return this.http.get<UserModel>(`${this.apiUrl}/profile`);
  }

  /**
   * Backend devuelve { status, data, message } y data es el UserResponseDto actualizado.
   * Aqui ya devolvemos directamente el user para que el consumidor no tenga que desempacar.
   */
  updateProfile(body: UserRequest): Observable<UserModel> {
    return this.http
      .patch<ApiResponse<UserModel>>(`${this.apiUrl}/editProfile`, body)
      .pipe(map((response) => response.data));
  }
}
