import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleRequest, RoleResponse } from '../../../store/User/user-model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);

  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`/back-end/v2/roles`);
  }

  getRolById(rolId: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`/back-end/v2/role/${rolId}`);
  }

  createRole(rolBody: RoleRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`/back-end/v2/role`, rolBody);
  }

  updateRole(rolId: number, body: RoleRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`/back-end/v2/role/${rolId}`, body);
  }

  deleteRole(rolId: number): Observable<void> {
    return this.http.delete<void>(`/back-end/v2/role/${rolId}`);
  }
}
