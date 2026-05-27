import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, UserModel, UserQueryParams, UserRequest } from '../../../store/User/user-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  private apiUrl = environment.backEnd.baseUrl + environment.backEnd.api.root + environment.backEnd.api.resoruces.adminManager.root;
  private path = environment.backEnd.api.resoruces.adminManager.endpoints;

  getUsers(query: UserQueryParams): Observable<Page<UserModel>> {
    const page = query.page ?? 0;

    const params = this.buildParams(query);

    return this.http.get<Page<UserModel>>(
      this.apiUrl + this.path.pageUser + page,
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
    return this.http.get<UserModel>(this.apiUrl + this.path.userByEmail + email);
  }

  getUserById(userId: number): Observable<UserModel> {
    return this.http.get<UserModel>(this.apiUrl + this.path.userByID + userId);
  }

  createUser(body: UserRequest): Observable<UserModel> {
    return this.http.post<UserModel>(this.apiUrl + this.path.saveUser, body);
  }

  updateUser(userId: number, body: UserRequest) {
    return this.http.patch<UserModel>(this.apiUrl + this.path.updateUser + userId, body);
  }
}

