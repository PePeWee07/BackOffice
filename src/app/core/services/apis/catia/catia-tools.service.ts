import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CatiaToolPermission,
  CatiaToolPermissionUpsertRequest,
  CatiaToolPermissionsMap,
} from './models/catia-tools';

/**
 * Gestión de las tools (funcionalidades) del asistente CatIA.
 * Consume el proxy del back-end: /api/v1/catia/core/tool-permissions.
 */
@Injectable({
  providedIn: 'root',
})
export class CatiaToolsService {
  private http = inject(HttpClient);

  private apiURL =
    environment.microservices.catiaCore.baseUrl +
    '/api/v1/catia/core/tool-permissions';

  listToolPermissions(): Observable<CatiaToolPermission[]> {
    return this.http.get<CatiaToolPermission[]>(this.apiURL);
  }

  getToolPermissionsMap(): Observable<CatiaToolPermissionsMap> {
    return this.http.get<CatiaToolPermissionsMap>(`${this.apiURL}/map`);
  }

  upsertToolPermission(
    toolName: string,
    body: CatiaToolPermissionUpsertRequest
  ): Observable<CatiaToolPermission> {
    const sanitized = toolName.trim();

    if (!sanitized) {
      throw new Error('El toolName es requerido');
    }

    return this.http.put<CatiaToolPermission>(
      `${this.apiURL}/${encodeURIComponent(sanitized)}`,
      body
    );
  }

  setToolPermissionEnabled(
    toolName: string,
    enabled: boolean
  ): Observable<CatiaToolPermission> {
    const sanitized = toolName.trim();

    if (!sanitized) {
      throw new Error('El toolName es requerido');
    }

    return this.http.patch<CatiaToolPermission>(
      `${this.apiURL}/${encodeURIComponent(sanitized)}/enabled`,
      null,
      { params: new HttpParams().set('enabled', String(enabled)) }
    );
  }

  deleteToolPermission(toolName: string): Observable<void> {
    const sanitized = toolName.trim();

    if (!sanitized) {
      throw new Error('El toolName es requerido');
    }

    return this.http.delete<void>(
      `${this.apiURL}/${encodeURIComponent(sanitized)}`
    );
  }

  restoreToolPermissionDefaults(): Observable<CatiaToolPermission[]> {
    return this.http.post<CatiaToolPermission[]>(
      `${this.apiURL}/restore-defaults`,
      null
    );
  }
}
