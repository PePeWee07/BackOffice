import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionListRequest, PermissionListResponse } from '../../../store/User/user-page';

@Injectable({
  providedIn: 'root',
})
export class AuthorityService {
  private http = inject(HttpClient);

  getPermissions(): Observable<PermissionListResponse[]> {
    return this.http.get<PermissionListResponse[]>(`/back-end/v2/permissions`);
  }

  getPermissionById(permissionId: number): Observable<PermissionListResponse> {
    return this.http.get<PermissionListResponse>(
      `/back-end/v2/permission/${permissionId}`
    );
  }

  createPermission(
    permissionBody: PermissionListRequest
  ): Observable<PermissionListResponse> {
    return this.http.post<PermissionListResponse>(
      `/back-end/v2/permission`,
      permissionBody
    );
  }

  updatePermission(
    permissionId: number,
    body: PermissionListRequest
  ): Observable<PermissionListResponse> {
    return this.http.put<PermissionListResponse>(
      `/back-end/v2/permission/${permissionId}`,
      body
    );
  }

  deletePermission(permissionId: number): Observable<void> {
    return this.http.delete<void>(`/back-end/v2/permission/${permissionId}`);
  }
}
