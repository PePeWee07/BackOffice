import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleRequest, RoleResponse } from '../../../store/User/user-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);

  private apiUrl = environment.backEnd.baseUrl + environment.backEnd.api.root;

  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`${this.apiUrl}/roles`);
  }

  getRolById(rolId: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/role/${rolId}`);
  }

  createRole(rolBody: RoleRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`${this.apiUrl}/role`, rolBody);
  }

  updateRole(rolId: number, body: RoleRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/role/${rolId}`, body);
  }

  deleteRole(rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/role/${rolId}`);
  }
}
