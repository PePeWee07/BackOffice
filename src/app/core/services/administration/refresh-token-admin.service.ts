import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  DeleteByUserResult,
  RefreshTokenPage,
  RefreshTokenQuery,
} from '../../../store/Token/refresh-token-model';

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenAdminService {
  private http = inject(HttpClient);

  private apiUrl =
    environment.backEnd.baseUrl + environment.backEnd.api.root + '/admin/refresh-tokens';

  getPaged(query: RefreshTokenQuery): Observable<RefreshTokenPage> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      params = params.set(key, value.toString());
    });
    return this.http.get<RefreshTokenPage>(`${this.apiUrl}/page`, { params });
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteAllByUserId(userId: number): Observable<DeleteByUserResult> {
    return this.http.delete<DeleteByUserResult>(`${this.apiUrl}/user/${userId}`);
  }
}
