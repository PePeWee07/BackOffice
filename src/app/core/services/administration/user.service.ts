import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, UserModel, UserQueryParams, UserRequest } from '../../../store/User/user-model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  getUsers(query: UserQueryParams): Observable<Page<UserModel>> {
    const page = query.page ?? 0;

    const params = this.buildParams(query);

    return this.http.get<Page<UserModel>>(
      `/back-end/v2/manager/users/page/${page}`,
      { params }
    );
  }

  private buildParams(query: UserQueryParams): HttpParams {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return params;
  }

  getUserByEmail(email: string): Observable<UserModel> {
    return this.http.get<UserModel>(`/back-end/v2/manager/user/email/${email}`);
  }

  getUserById(userId: string): Observable<UserModel> {
    return this.http.get<UserModel>(`/back-end/v2/manager/user/${userId}`);
  }

  createUser(body: UserRequest): Observable<UserModel> {
    return this.http.post<UserModel>(`/back-end/v2/manager/user`, body);
  }

  updateUser(userId: number, body: UserRequest) {
    return this.http.patch<UserModel>(
      `/back-end/v2/manager/user/${userId}`,
      body
    );
  }
}

