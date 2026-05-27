import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionListRequest, PermissionListResponse } from '../../../store/User/user-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthorityService {
  private http = inject(HttpClient);

  private apiUrl = environment.backEnd.baseUrl + environment.backEnd.api.root;

  getPermissions(): Observable<PermissionListResponse[]> {
    return this.http.get<PermissionListResponse[]>(`${this.apiUrl}/permissions`);
  }

  getPermissionById(permissionId: number): Observable<PermissionListResponse> {
    return this.http.get<PermissionListResponse>(
      `${this.apiUrl}/permission/${permissionId}`
    );
  }

  createPermission(
    permissionBody: PermissionListRequest
  ): Observable<PermissionListResponse> {
    return this.http.post<PermissionListResponse>(
      `${this.apiUrl}/permission`,
      permissionBody
    );
  }

  updatePermission(
    permissionId: number,
    body: PermissionListRequest
  ): Observable<PermissionListResponse> {
    return this.http.put<PermissionListResponse>(
      `${this.apiUrl}/permission/${permissionId}`,
      body
    );
  }

  deletePermission(permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permission/${permissionId}`);
  }
}
