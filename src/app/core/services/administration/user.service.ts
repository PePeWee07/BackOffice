import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, UserModel, UserQueryParams } from '../../../store/User/user-page';

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
}

